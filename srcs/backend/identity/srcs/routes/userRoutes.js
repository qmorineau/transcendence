import { z } from 'zod';
import { hashPassword, verifyPassword } from '../auth.js';
import path from 'node:path'
import { createWriteStream } from 'node:fs'
import { promises as fs } from 'node:fs'
import redis from '../redis/redis.js'
import * as OTPAuth from "otpauth";
import pkg from "hi-base32";
import crypto from 'crypto';
import { randomUUID, randomBytes } from 'crypto';
import { request } from 'undici';
import QRCode from 'qrcode';
import fst from 'fs';

/******     HELPERS     ******/
const routeErrorHandling = (handler, { message = 'Internal server error', statusCode = 500 } = {}) => {
    return async (req, reply) => {
        try {
            return await handler(req, reply);
        } catch (error) {
            req.log.error({ err: error }, 'Caught route error');
            if (reply.sent) return;

            const code = Number.isInteger(error?.statusCode) ? error.statusCode : statusCode;
            const payload = code >= 500
                ? { error: message }
                : { error: error?.message || message };

            return reply.code(code).send(payload);
        }
    };
};

const loginParamSchema = z.object({
    login: z.string().min(2).max(12).regex(/^[A-Za-z0-9_]+$/),
});

const parseLoginParam = (req, reply) => {
    const result = loginParamSchema.safeParse(req.params);
    if (!result.success) {
        reply.code(400).send({ error: "Invalid login" });
        return null;
    }
    return result.data.login;
};

const RegisterSchema = z.object({
    login: z.string().min(6, 'Login must be at least 6 characters long').max(12, 'Login must be at most 12 characters long').regex(/^[A-Za-z0-9_]+$/i, 'Login must only contain alpha-numerical characters and underscores'),
    password: z.string().min(8, 'Password must be at least 8 characters long').max(24, 'Password must be at most 24 characters long'),
    firstName: z.string().regex(/^[a-z]+$/i, 'First name contains invalid characters (only alphabetical characters accepted)'),
    lastName: z.string().regex(/^[a-z]+$/i, 'Last name contains invalid characters (only alphabetical characters accepted)'),
});
const UserUpdateSchema = z.object({
    login: z.string().min(6, 'Login must be at least 6 characters long').max(12, 'Login must be at most 12 characters long').regex(/^[A-Za-z0-9_]+$/i, 'Login must only contain alpha-numerical characters and underscores').optional(),
    password: z.string().min(8, 'Password must be at least 8 characters long').max(24, 'Password must be at most 24 characters long').optional(),
    firstName: z.string().regex(/^[a-z]+$/i, 'First name contains invalid characters (only alphabetical characters accepted)').optional(),
    lastName: z.string().regex(/^[a-z]+$/i, 'Last name contains invalid characters (only alphabetical characters accepted)').optional(),
});
const loginSchema = z.object({
    login: z.string().min(6, 'Login must be at least 6 characters long').max(12, 'Login must be at most 12 characters long').regex(/^[A-Za-z0-9_]+$/i, 'Login must only contain alpha-numerical characters and underscores'),
    password: z.string().min(8, 'Password must be at least 8 characters long').max(24, 'Password must be at most 24 characters long'),
});
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) // HOMEMADE SLEEP

// TIMER TO RESET 2FA FIRST STEP
const TWO_FA_RESET_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const twoFactorResetTimers = new Map();
const scheduleTwoFactorReset = (fastify, userId, delay = TWO_FA_RESET_TIMEOUT_MS) => {
    const existingTimer = twoFactorResetTimers.get(userId);
    if (existingTimer) clearTimeout(existingTimer);

    const timer = setTimeout(() => {
        (async () => {
            try {
                await fastify.prisma.user.update({
                    where: { id: userId },
                    data: { firstStep: false, twoFA_uuid: null },
                });
            } catch (error) {
                fastify.log?.error({ err: error, userId }, 'Failed to reset 2FA first step');
            } finally {
                twoFactorResetTimers.delete(userId);
            }
        })();
    }, delay);

    if (typeof timer.unref === 'function') timer.unref();
    twoFactorResetTimers.set(userId, timer);
};

const { encode } = pkg
function generateRandomBase32() {
    const buffer = crypto.randomBytes(15);
    const base32 = encode(buffer).replace(/=/g, "").substring(0, 24);
    return base32;
}


function b64u(buf) {
  return buf.toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

const cookieSecure = true;

/*****     ROUTES     *****/
const userRoutes = async (fastify, options) => {

    // REGISTER
    fastify.post('/api/user/register', routeErrorHandling(async (req, reply) => {
        const parsed = RegisterSchema.safeParse(req.body);
        if (!parsed.success) return reply.code(400).send({ error: JSON.parse(parsed.error).map((e) => e.message).join(', ') });

        const { login, password, firstName, lastName } = parsed.data;
        const passwordHash = await hashPassword(parsed.data.password);
        const title = "USER";
    
        try {
            // TRY CREATING THE USER
            const user = await fastify.prisma.user.create({
                data: { login: login, passwordHash, firstName: firstName, lastName: lastName, title: title },
                select: { id: true, login: true, title: true, firstName: true, lastName: true, createdAt: true },
            });
    
            const payload = { sub: user.id, login: user.login, title: user.title };
    
            const token = await reply.jwtSign(payload, { expiresIn: '12h' });
            reply.setCookie('session', token, {
                httpOnly: true,
                sameSite: true,
                secure: true,
                path: '/api'
            });
            
            redis.onUserCreation(user.id);
            return reply.code(200).send(user);
        } catch (e) {
            if (e.code === 'P2002') { // ERROR CODE OF LOGIN NOT UNIQUE
                return reply.code(409).send({ error: "Login already registered" });
            }
            req.log.error(e);
            return reply.code(500).send({ error: "Failed to register user" });
        }
    }));


    // LOGIN
    fastify.post('/api/user/login', routeErrorHandling(async (req, reply) => {
        const parsed = loginSchema.safeParse(req.body);
    
    
        if (!parsed.success) {
            await sleep(1500); // PREVENTS BRUTE FORCE LOGIN
            return reply.code(400).send({ error: JSON.parse(parsed.error).map((e) => e.message).join(', ') });
        }
        const { login, password } = parsed.data
        
        const user = await fastify.prisma.user.findUnique({ 
            where: { login: login },
            select: { id: true, login: true, title: true, passwordHash: true, twoFA_enabled: true },
        });
        if (!user || !user.passwordHash) {
            await sleep(1500);
            return reply.code(401).send({ error: "Invalid login or password" });
        }

        
        // CHECK PASSWORD OF THE USER
        const passwordCheck = await verifyPassword(user.passwordHash, password);
        if (!passwordCheck) {
            await sleep(1500);
            return reply.code(401).send({ error: "Invalid login or password"});
        }
        
        // IF 2FA IS ENABLED, ASK FOR TOKEN
        if (user.twoFA_enabled) {
            const uuid = randomUUID();
            await fastify.prisma.user.update({
                where: { id: user.id },
                data: { firstStep: true, twoFA_uuid: uuid },
            });
            scheduleTwoFactorReset(fastify, user.id);

            return reply.code(202).send({ twoFA: uuid, message: "2FA enabled, please validate your token" });
        }

        // SUCCESSFULLY LOGGED IN
        const payload = { sub: user.id, login: user.login, title: user.title };
    
        const token = await reply.jwtSign(payload, { expiresIn: '12h' });
    
        reply.setCookie('session', token, {
            httpOnly: true,
            sameSite: true,
            secure: true,
            path: '/api'
        });
    
        return reply.code(200).send({ ok: true });
    }));

    // LOGOUT
    fastify.get('/api/user/logout', routeErrorHandling(async (req, reply) => {
        reply.setCookie('session', '', {
            httpOnly: true,
            sameSite: true,
            secure: true,
            path: '/api',
            maxAge: 0
        });
        return reply.send({ ok: true });
    }))

    // DELETE AN ACCOUNT
    fastify.delete('/api/user/delete', { preHandler: [fastify.auth, fastify.title] }, routeErrorHandling(async (req, reply) => {
        const userId = Number(req.user.sub);
        
        try {
            await fastify.prisma.user.delete({where: { id: userId } });
            redis.onUserDeletion(userId);
            reply.setCookie('session', '', {
                httpOnly: true,
                sameSite: true,
                secure: true,
                path: '/api',
                maxAge: 0
            });
            return reply.send({ ok: true });
        } catch (e) {
            if (e.code === 'P2025') { // ERROR CODE OF RECORD NOT FOUND
                return reply.code(410).send({ error: "Record to delete doesn't exist" });
            }
            req.log.error(e);
            return reply.code(400).send({ error: "Failed to delete user" });
        }
    }))

    // UPDATE USER INFO
    fastify.post('/api/user/update', { preHandler: [fastify.auth, fastify.title]}, routeErrorHandling(async (req, reply) => {
		const userLogin = req.user.login;
		const parsed = UserUpdateSchema.safeParse(req.body);
        if (!parsed.success) return reply.code(400).send({ error: JSON.parse(parsed.error).map((e) => e.message).join(', ') });

		const { login, password, firstName, lastName } = parsed.data;
		if (!login && !password && !firstName && !lastName) return reply.code(400).send({ error: "No information to update" });


		const user = await fastify.prisma.user.findUnique({ where: { login: userLogin }, select: { id: true, login: true, firstName: true, lastName: true }, });
		if (!user) return reply.code(400).send({ error: "User to update does not exist" });

		let passwordHash;
		if (password) {
			passwordHash = await hashPassword(password);
		}
		const dataUpdate = { login, passwordHash, firstName, lastName };
        try {
            const { count } = await fastify.prisma.user.updateMany({
                where: { id: Number(req.user.sub), login: userLogin },
                data: dataUpdate,
            })
            if (count === 0)
                return reply.code(409).send({ error: "Updating the user failed" });
            
            const updated = await fastify.prisma.user.findUnique({
                where: { id: Number(req.user.sub) },
                select: { id: true, login: true, firstName: true, lastName: true, title: true },
            })

            const payload = { sub: updated.id, login: updated.login, title: updated.title };
        
            const token = await reply.jwtSign(payload, { expiresIn: '12h' });
        
            reply.setCookie('session', token, {
                httpOnly: true,
                sameSite: true,
                secure: true,
                path: '/api'
            });
            
            return reply.send({ ok: true });
        } catch (e) {
            if (e.code === 'P2002') { // ERROR CODE OF LOGIN NOT UNIQUE
                req.log.error(e);
                return reply.code(409).send({ error: "Login already exists" });
            }
            req.log.error(e);
            return reply.code(400).send({ error: "Failed to update user" });
        }
    }));

    // CREATE A GUEST ACCOUNT
    fastify.post('/api/user/guest', routeErrorHandling(async (req, reply) => {
        const login = "Guest";
        const password = randomUUID();
        const title = "GUEST";
        const passwordHash = await hashPassword(password);

        try {
            const guest = await fastify.prisma.user.create({
                data: { login, passwordHash, title, firstName: 'Guest', lastName: 'Guest' },
                select: { id: true, login: true, title: true },
            });
            
            const newLogin = "Guest" + guest.id;;
            const update = await fastify.prisma.user.update({
                where: { id: guest.id },
                data: {
                    login: newLogin,
                },
                select: { id: true, title: true, login: true },
            });
            
            const payload = { sub: update.id, login: update.login, title: update.title };
            
            redis.onUserCreation(update.id);

            const token = await reply.jwtSign(payload, { expiresIn: '12h' });
            reply.setCookie('session', token, {
                httpOnly: true,
                sameSite: true,
                secure: true,
                path: '/api'
            });

            return reply.code(200).send(update);
        } catch (error) {
            return reply.code(400).send({ error: "Error creating the guest user", msg: error.message });
        }
    }));

    // CHANGE AVATAR PICTURE
    fastify.post('/api/user/me/avatar', { preHandler: [fastify.auth, fastify.title] }, routeErrorHandling(async (req, reply) => {
		const part = await req.file();
		if (!part) return reply.code(400).send({ error: "No file uploaded" });
		
		const allowed = ['image/png', 'image/jpeg', 'image/webp'];
		if (!allowed.includes(part.mimetype)) return reply.code(415).send({ error: "File type not supported", details: `Allowed types: ${allowed.join(', ')}` });

		const userId = Number(req.user.sub);
		const ext = part.mimetype.split('/')[1];
		
		const dir = path.join(process.cwd(), 'public', 'avatars');
		await fs.mkdir(dir, { recursive: true });
		const filePath = path.join(dir, `${userId}.${ext}`);
		
		await new Promise((res, rej) =>
				part.file.pipe(createWriteStream(filePath))
					.on('finish', res)
					.on('error', rej)
		);

		await fastify.prisma.user.update({
			where: { id: userId },
			data: {
				avatarUrl: filePath,
				avatarMime: part.mimetype,
			},
		});

		return reply.send({ ok: true });
	}));

    fastify.get('/api/user/:login/avatar', { preHandler: [fastify.auth]}, routeErrorHandling(async (req, reply) => {

        const targetLogin = parseLoginParam(req, reply);
        if (targetLogin === null) return;

        const user = await fastify.prisma.user.findUnique({
            where: { login: targetLogin },
            select: { avatarUrl: true, avatarMime: true },
        });
        const path = user ? user.avatarUrl : '/app/public/avatars/deleted.png';
        const mime = user ? user.avatarMime : 'image/png';

        try {
            fs.access(path);
        } catch (error) {
            return reply.code(404).send({ error: "Avatar file not found or does not exist", err: error.message });
        }

        const stream = fst.createReadStream(path);
        stream.on('error', (error) => {
            fastify.log.error({ err: error, path: path }, 'Error reading avatar file');
            if (!reply.sent) {
                return reply.code(404).send({ error: "Avatar file not found or does not exist", err: error.message });
            }
        });
        reply.header('Content-Type', mime || 'application/octet-stream')
             .header('Cache-Control', 'public, max-age=3600');
        return reply.send(stream);
    }));

    // GET NAMES FROM USER
	fastify.get('/api/user/:login/names', { preHandler: [fastify.auth]}, routeErrorHandling(async (req, reply) => {

        const targetLogin = parseLoginParam(req, reply);
        if (targetLogin === null) return;

		const user = await fastify.prisma.user.findUnique({
			where: { login: targetLogin },
			select: { login:  true, firstName: true, lastName: true },
		});
		if (!user) return reply.code(400).send({ error: "User does not exist" });

		return reply.send(user);
	}));

    // GET USER STATUS
    fastify.get('/api/user/:login/status', { preHandler: [fastify.auth]}, routeErrorHandling(async (req, reply) => {

        const targetLogin = parseLoginParam(req, reply);
        if (targetLogin === null) return;

        const user = await fastify.prisma.user.findUnique({
            where: { login: targetLogin },
            select: { login: true, status: true },
        })
        if (!user) return reply.code(400).send({ error: "User does not exist" });

        return reply.send(user);
	}));

    //GET A USER FROM LOGIN
    fastify.get('/api/user/login/:login', routeErrorHandling(async (req, reply) => {
        const targetLogin = parseLoginParam(req, reply);
        if (targetLogin === null) return;

        const user = await fastify.prisma.user.findUnique({
            where: { login: targetLogin },
            select: { id: true, login: true },
        })
        if (!user) return reply.code(404).send({ error: "User does not exist" });

        return reply.send(user);
    }))

    //GET A USER FROM ID
    fastify.get('/api/user/id/:id', routeErrorHandling(async (req, reply) => {
        const user = await fastify.prisma.user.findUnique({
            where: { id: Number(req.params.id) },
            select: { id: true, login: true },
        })
        if (!user) return reply.code(404).send({ error: "User does not exist" });

        return reply.send(user);
    }))

    // LOOKING FOR A USER
    fastify.get('/api/user/search/:login', { preHandler: [fastify.auth, fastify.title] }, routeErrorHandling(async (req, reply) => {
		const login = parseLoginParam(req, reply);
		if (login === null) return;

		const users = await fastify.prisma.user.findMany({
			where: {
				login: {
					startsWith: login
				},
			},
			select: { login: true },
			take: 5,
			orderBy: { login: 'asc' },
		})
		return reply.send(users);

	}));



    
    // SET STATUS ONLINE
    fastify.post('/internal/:id/online', routeErrorHandling(async (req, reply) => {
        await fastify.prisma.user.update({
            where: { id: Number(req.params.id) },
            data: { status: "ONLINE" },
        });
    }));

    // SET STATUS OFFLINE                => NOT DONE HERE BUT IN REDIS
    fastify.post('/internal/:id/offline', routeErrorHandling(async (req, reply) => {
        await fastify.prisma.user.update({
            where: { id: Number(req.params.id) },
            data: { status: "OFFLINE" }
        })
    }))

    // ROUTE FOR FRIEND LIST
    fastify.post('/internal/users/lookup', routeErrorHandling(async (req, reply) => {
        const body = req.body || {};
        const ids = Array.isArray(body.ids) ? body.ids : [];

        if (ids.length === 0) return reply.send([]);
		const users = await fastify.prisma.user.findMany({
			where: { id: { in: ids } },
			select: { id: true, login: true, title: true },
		});

        const order = new Map(ids.map((id, i) => [id, i]));
        users.sort((a, b) => (order.get(a.id) || 0) - (order.get(b.id) || 0));

        return reply.send(users);
    }));

    /*********************    2FA    *********************/
    fastify.get('/api/user/2faSetup', { preHandler: [fastify.auth, fastify.title]}, routeErrorHandling(async (req, reply) => {
        try {

            const userId = Number(req.user.sub);
            
            const user = await fastify.prisma.user.findUnique({ 
                where: { id: userId }, 
                select: { id: true, login: true, oauthEnabled: true } 
            });
            if (!user) return reply.code(400).send({ error: "User does not exist" });
            if (user.oauthEnabled) return reply.code(403).send({ error: "OAuth users cannot use 2FA" });
            
            const base32_secret = generateRandomBase32();
            
            let totp = new OTPAuth.TOTP({
                issuer: "ft_transcendance",
                label: user.login,
                algorithm: "SHA1",
                digits: 6,
                secret: base32_secret,
            });
            
            let otpauth_url = totp.toString();

            await fastify.prisma.user.update({
                where: { id: userId },
                data: {
                    otp_base32: base32_secret,
                    otp_auth_url: otpauth_url,
                },
            });

            reply.header('Content-Type'  , 'image/png')
                 .header('Cache-Control' , 'no-store, no-cache, must-revalidate')
                 .header('Pragma'        , 'no-cache')
                 .header('Expires'       , '0')
            const stream = await QRCode.toBuffer(otpauth_url, { type: 'png', margin: 1, width: 320 });
            return reply.send(stream);

        } catch (error) {
            return reply.code(500).send({ error: error.message })
        }
    }));

    fastify.post('/api/user/2faVerify', { preHandler: [fastify.auth, fastify.title] }, routeErrorHandling(async (req, reply) => {

        try {

            const userId = Number(req.user.sub);
            const { token } = req.body;

            const user = await fastify.prisma.user.findUnique({ where: { id: userId } });
            if (!user) return reply.code(400).send({ error: "User does not exist" });

            let totp = new OTPAuth.TOTP({
                issuer: "ft_transcendance",
                label: user.login,
                algorithm: "SHA1",
                digits: 6,
                secret: user.otp_base32,
            });

            let diff = totp.validate({ token });
            if (diff === null) return reply.code(401).send({ error: "Token is not valid" });

            const updated = await fastify.prisma.user.update({
                where: { id: userId },
                data: {
                    twoFA_enabled: true,
                    twoFA_verified: true
                },
            })

            return reply.send({ ok: true });

        } catch (error) {
            return reply.code(500).send({ error: error.message });
        }
    }));

    fastify.post('/api/user/2faValidate', routeErrorHandling(async (req, reply) => {

        try {
            const { token, uuid } = req.body;

            const user = await fastify.prisma.user.findUnique({ where: { twoFA_uuid: uuid, twoFA_enabled: true } });
            if (!user) return reply.code(400).send({ error: "User does not exist or did not activate 2FA" });
            if (!user.firstStep) return reply.code(400).send({ error: "First step of authentication not done" });
            if (user.title !== "USER") return reply.code(403).send({ error: "Only users can use 2FA" });


            let totp = new OTPAuth.TOTP({
                issuer: "ft_transcendance",
                label: user.login,
                algorithm: "SHA1",
                digits: 6,
                secret: user.otp_base32,
            });

            let diff = totp.validate({ token });
            if (diff === null) return reply.code(401).send({ error: "Token is not valid" });

            // SUCCESSFULLY LOGGED IN
            const payload = { sub: user.id, login: user.login, title: user.title };
        
            const cookie = await reply.jwtSign(payload, { expiresIn: '12h' });
        
            reply.setCookie('session', cookie, {
                httpOnly: true,
                sameSite: true,
                secure: true,
                path: '/api'
            });

            // RESET FIRST STEP AND UUID
            await fastify.prisma.user.update({
                where: { id: user.id },
                data: { firstStep: false, twoFA_uuid: null },
            });

            return reply.code(200).send({ ok: true });

        } catch (error) {
            return reply.code(500).send({ error: error.message });
        }
    }));

    fastify.post('/api/user/2faDisable', { preHandler: [fastify.auth, fastify.title] }, routeErrorHandling(async (req, reply) => {
        try {

            const userId = Number(req.user.sub);

            const user = await fastify.prisma.user.findUnique({ where: { id: userId }, select: { twoFA_enabled: true, twoFA_verified: true, oauthEnabled: true } });
            if (!user) return reply.code(400).send({ error: "User does not exist" });
            if (user.oauthEnabled) return reply.code(400).send({ error: "OAuth users cannot use 2FA" });

            const updated = await fastify.prisma.user.update({
                where: { id: userId },
                data: {
                    twoFA_enabled: false,
                    twoFA_verified: false,
                    otp_base32: null,
                    otp_auth_url: null,
                },
            });

            return reply.send({ ok: true });

        } catch (error) {
            return reply.code(500).send({ error: error.message })
        }
    }));

    fastify.get('/api/user/2faStatus', { preHandler: [fastify.auth, fastify.title] }, routeErrorHandling(async (req, reply) => { 
        
        const userId = Number(req.user.sub);

        const user = await fastify.prisma.user.findUnique({ where: { id: userId }, select: { twoFA_enabled: true, twoFA_verified: true, oauthEnabled: true } });
        if (!user) return reply.code(400).send({ error: "User does not exist" });

        if (user.oauthEnabled) return reply.send({ twoFA: false });

        return reply.send({ twoFA: (user.twoFA_enabled && user.twoFA_verified) });
    }));

    /*********************    REMOTE AUTHENTICATION    *********************/
    fastify.get('/api/user/github/start', async (req, reply) => {
        
        const redirect = process.env.FRONTEND_URL || 'https://fu-r6-p1:8080';

        reply.setCookie('oauth_redirect', String(redirect), {
            httpOnly: true,
            sameSite: 'lax',
            secure: true,
            path: '/api/user',
            maxAge: 60 * 10
        });

        const url = await fastify.githubOAuth.generateAuthorizationUri(req, reply);
        return reply.redirect(url);
    });

    fastify.get('/api/user/github/callback', routeErrorHandling(async (req, reply) => {
        if (req.query?.error_description) {
            fastify.log.error({ err: req.query }, 'OAuth error from GitHub');
            return reply.redirect(String(process.env.FRONTEND_URL));
        }
        // Exchange authorization code
        // TRY BECAUSE WE GOT AN "INTERNAL SERVER ERROR" FROM GITHUB => TO FIX
        let accessToken;
        try {
            const token = await fastify.githubOAuth.getAccessTokenFromAuthorizationCodeFlow(req);
            accessToken = token && token.token && token.token.access_token;
        } catch (error) {
            fastify.log.error({ err: error }, 'OAuth token exchange error');
            reply.clearCookie('oauth_redirect', { path: '/api/user' });
            return reply.redirect(String(process.env.FRONTEND_URL || '/'));
        }

        // Fetch GitHub user
        const ghUserResp = await request('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'transcendance' }
        });
        if (ghUserResp.statusCode >= 400) {
            return reply.code(502).send({ error: 'GitHub response error' });
        }
        const ghUser = await ghUserResp.body.json(); // { id, login, avatar_url, name, ... }

        // Link or create local user
        const provider = 'github';
        const providerUserId = String(ghUser.id);

        let identity = await fastify.prisma.oAuthIdentity.findUnique({
            where: { provider_providerUserId: { provider, providerUserId } },
            include: { user: true }
        });

        let user = identity && identity.user;

        if (!user) {
            // Make a compliant local login (6–12 chars, [A-Za-z0-9_]+)
            const base = String(ghUser.login || 'gh').replace(/[^A-Za-z0-9_]/g, '_').replace(/^_+|_+$/g, '').slice(0, 12);

            async function allocateLogin() {
                let candidate = (base || 'ghuser').padEnd(6, '0').slice(0, 12);
                for (let i = 0; i < 20; i++) {
                    const suffix = i === 0 ? '' : String(Math.floor(Math.random() * 1000)).padStart(2, '0');
                    const login = (candidate + suffix).slice(0, 12);
                    const exists = await fastify.prisma.user.findUnique({ where: { login } });
                    if (!exists) return login;
                }
                return `gh${Date.now()}`.slice(0, 12);
            }

            const login = await allocateLogin();

            // Create a random password hash
            const randomPwd = b64u(randomBytes(24));
            const passwordHash = await hashPassword(randomPwd);

            // Create the local user
            user = await fastify.prisma.user.create({
                data: {
                    login,
                    passwordHash,
                    title: 'USER',
                    firstName: ghUser.name ? String(ghUser.name).split(' ')[0] : 'GitHub',
                    lastName: ghUser.name ? String(ghUser.name).split(' ').slice(1).join(' ') || 'User' : 'User',
                    oauthEnabled: true,
                    // avatarUrl/otp fields remain defaults per your schema
                },
                select: { id: true, login: true, title: true }
            });

            // Link OAuth identity
            identity = await fastify.prisma.oAuthIdentity.create({
                data: {
                    provider,
                    providerUserId,
                    userId: user.id,
                    username: ghUser.login || null,
                    avatarUrl: ghUser.avatar_url || null,
                    scopes: 'read:user user:email'
                }
            });

            try { redis.onUserCreation(user.id); } catch (_) { }
        }


        // sign session now 
        const payload = { sub: user.id, login: user.login, title: user.title };
        const tokenJwt = await reply.jwtSign(payload, { expiresIn: '12h' });

        reply.setCookie('session', tokenJwt, {
            httpOnly: true,
            sameSite: true,
            secure: true,
            path: '/api'
        });

        const back = req.cookies['oauth_redirect'] || process.env.FRONTEND_URL || '/';
        reply.clearCookie('oauth_redirect', { path: '/api/user' });

        return reply.redirect(String(back));
    }));
}


export default userRoutes;

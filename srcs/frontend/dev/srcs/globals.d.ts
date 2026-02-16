export {};

declare global 
{
	interface Window 
	{
		udef_old_hash		 : string;
		udef_pending_hash	 : string;
		udef_before_settings : string;
		udef_whoami			 : string;
		udef_title			 : string;
		udef_ws				 : WebSocket;
		udef_uuid			 : string;
	}
}

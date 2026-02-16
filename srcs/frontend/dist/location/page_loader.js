import { load_file_in_div } from "../tools/utils.js";
// goto page
async function goto_page(page, logic) {
    load_file_in_div('app', 'modules/' + page)
        .then(success => { if (success) {
        logic();
    } });
}
export { goto_page };

import blessed from "neo-blessed";
import utils from "./utilsCreatePage.js";

const errorContainer = {
	width: "100%",
	height: "100%",
	valign: "middle",
	align: "center",
	border: {
		type: "line"
	},
	style: {
		fg: "red",
		bg: "black",
		border: {
			fg: "red",
			bg: "black",
		}
	}
}

function createErrorPage(page)
{
	const container = blessed.box(utils.getBaseContainer());
	page.container.append(container);

	const error = blessed.box(errorContainer);

	page.register("error", error);
}

export default createErrorPage;
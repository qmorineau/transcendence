function getBaseContainer()
{
	return {
		top: 0,
		left: 0,
		width: "100%",
		height: "100%",
		bg: "black",
		fg: "white",
		hidden: true,
	}
}

function getTitleContainer()
{
	return {
		name: "title",
        top: 2,
		width: "100%",
		height: 1,
		align: "center",
		bg: "blue",
		fg: "white",
    };
}

function getKeyMenuContainer()
{
	return {
		name: "keysMenu",
		top: 0,
		height: 2,
		align: "center",
		width: "100%",
		fg: "red",
		bg: "black",
	}
}


export default {getBaseContainer, getKeyMenuContainer, getTitleContainer}
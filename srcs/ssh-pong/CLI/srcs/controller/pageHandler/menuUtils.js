function selectUp(menu)
{
    const index = menu.selected;
    const length = menu.items.length;

    if (index - 1 < 0)
        menu.select(length - 1);
    else
        menu.select(index - 1);
}

function selectDown(menu)
{
    const index = menu.selected;
        const length = menu.items.length;

    if (index + 1 == length)
        menu.select(0);
    else
        menu.select(index + 1);
}

export default {selectDown, selectUp}
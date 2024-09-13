'use strict';

const grid = document.querySelector('.grid');
let size = 40;

let start;
let end;

let pickingStart = true;

const isObstructed = (tile) => tile && tile.style.backgroundColor === 'black';

const eraseIfExists = (node) => {
    if (!node) return;
    node.element.style.backgroundColor = 'white';
    node.element.textContent = '';
};

const addTile = (index) => {
    const tile = document.createElement('div');
    tile.addEventListener('contextmenu', (event) => event.preventDefault());
    tile.addEventListener('mousedown', function (event) {
        event.preventDefault();

        const obstructed = isObstructed(tile);

        if (event.button === 1) {
            tile.style.backgroundColor = obstructed ? 'white' : 'black';
            return;
        }

        if (obstructed) {
            return;
        }

        if (pickingStart) {
            eraseIfExists(start);
            tile.style.backgroundColor = 'yellow';
            tile.textContent = 'S';
            start = new Node(index);
        } else {
            eraseIfExists(end);
            tile.style.backgroundColor = 'yellow';
            tile.textContent = 'E';
            end = new Node(index);
        }

        pickingStart = !pickingStart;
    });
    return tile;
};

const createGrid = (size) => {
    grid.innerHTML = '';
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < size ** 2; index++) {
        const tile = addTile(index);
        if (Math.random() > 0.7) {
            tile.style.backgroundColor = 'black';
        }
        fragment.appendChild(tile);
    }
    grid.appendChild(fragment);
    grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${size}, 1fr)`;
};

createGrid(size);

class Node {
    constructor(index) {
        this.index = index;
        this.element = document.querySelector(
            `.grid > div:nth-child(${index + 1})`
        );
        this.x = this.index % size;
        this.y = Math.floor(this.index / size);
    }

    offset(x, y) {
        const newCol = this.x + x;
        const newRow = this.y + y;
        if (newCol < 0 || newCol >= size || newRow < 0 || newRow >= size) {
            return null;
        }
        const newIndex = newRow * size + newCol;
        const offset = new Node(newIndex);
        offset.parent = this;
        return offset;
    }

    manhattanDistance(node) {
        return Math.abs(this.x - node.x) + Math.abs(this.y - node.y);
    }

    getFCost() {
        return this.hCost + this.gCost;
    }
}

const offsets = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
];

const findNode = async () => {
    if (!start || !end) {
        alert('You must specify a starting and ending node!');
        return;
    }

    const open = new Map();
    const closed = new Set();
    const updateQueue = [];

    start.gCost = 0;
    start.hCost = start.manhattanDistance(end);
    open.set(start.index, start);

    while (open.size > 0) {
        const currentNode = Array.from(open.values()).reduce((a, b) =>
            a.getFCost() < b.getFCost() ? a : b
        );
        open.delete(currentNode.index);
        closed.add(currentNode.index);

        if (currentNode.index === end.index) {
            await updateNodes(updateQueue);
            return currentNode;
        }

        for (const [dx, dy] of offsets) {
            const neighborNode = currentNode.offset(dx, dy);
            if (
                !neighborNode ||
                isObstructed(neighborNode.element) ||
                closed.has(neighborNode.index)
            ) {
                continue;
            }

            const tentativeGCost = currentNode.gCost + 1;

            if (
                !open.has(neighborNode.index) ||
                tentativeGCost < neighborNode.gCost
            ) {
                neighborNode.gCost = tentativeGCost;
                neighborNode.hCost = neighborNode.manhattanDistance(end);
                neighborNode.parent = currentNode;

                if (!open.has(neighborNode.index)) {
                    open.set(neighborNode.index, neighborNode);
                    updateQueue.push(neighborNode);
                }
            }
        }
    }

    return null;
};

const updateNodes = async (nodes) => {
    for (const node of nodes) {
        if (node.index !== start.index && node.index !== end.index) {
            node.element.style.backgroundColor = 'lightblue';
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
    }
};

const findPath = async () => {
    const endNode = await findNode();
    if (endNode) {
        let node = endNode.parent;
        while (node && node.index !== start.index) {
            node.element.style.backgroundColor = 'plum';
            node = node.parent;
        }
    }
};

const clearTiles = () => {
    start = null;
    end = null;
    for (let index = 0; index < grid.children.length; index++) {
        const tile = grid.children[index];
        if (!isObstructed(tile)) {
            tile.textContent = '';
            tile.style.backgroundColor = 'white';
        }
    }
};

document.querySelector('.reset-button').addEventListener('click', clearTiles);
document.querySelector('.randomize-button').addEventListener('click', () => {
    clearTiles();
    createGrid(size);
});
document.getElementById('size-slider').onchange = function () {
    size = this.value;
};

document.getElementById('find-path').addEventListener('click', findPath);

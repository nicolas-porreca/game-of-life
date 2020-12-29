# Game Of Life

This project is a React implementation of [Conway's Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life) made by [Nicolas Porreca](https://github.com/nicolas-porreca).

## Description

Given a input generation, the goal is to calculate the next generation. The world consists of a two dimensional grid of cells, where each cell is either dead or alive. Let's assume that the grid is finite and no life can exist off the edges.

Given a cell we define its eight _neighbours_ as the cells that are horizontally, vertically, or diagonally adjacent. The rules for calculating the next generation are as follows:

1. Any live cell with fewer than two live neighbours dies.
2. Any live cell with two or three live neighbours lives on to the next generation.
3. Any live cell with more than three live neighbours dies.
4. Any dead cell with exactly three live neighbours becomes a live cell.

## Implementation

The initial state can be configured from the user interface, or provided via a text file that specifies:

-   the current generation number
-   the grid size
-   the population state (`*` represents a live cell, `.` represents a dead cell)

This is an example of input file specifying the third generation on a 4 by 8 grid:

```
Generation 3:
4 8
........
....*...
...**...
........
```

The input is shown on screen, and can be tweaked at runtime.
Some sample text files are provided in the `examples` folder.
Enjoy!

import React, { useCallback, useEffect, useState } from 'react';

import styles from './App.module.scss';
import TextReader from './components/TextReader';
import { defaultMatrix } from './helpers/default-matrix';
import { NEIGHBOURS_MATRIX } from './helpers/neighbours-matrix';
import { GAME_SPEED } from './helpers/game-speeds';
import { EDIT_MATRIX } from './helpers/edit-matrix';

// The main idea is to determine the number of cells by multiplying numberOfRows * numberOfCols and storing them into an array of JSX elements (matrix). The wrapper div is a css grid which uses the numberOfRows and numberOfCols to correctly display the elements of the matrix. We keep track of the alive cells in a separate structure (aliveCells), which is an array of strings that represent the coordinates of the alive cells in the format row|col. Since we know that for any given generation the only cells that can be affected are the neighbours of the currently alive cells, this approach should improve the application performances, since we can check a limited amount of cells instead of the whole matrix at every cycle.

const App: React.FC<{}> = () => {
    const [generation, setGeneration] = useState<number>(defaultMatrix.generation);
    const [numberOfRows, setNumberOfRows] = useState<number>(defaultMatrix.rows);
    const [numberOfCols, setNumberOfCols] = useState<number>(defaultMatrix.cols);
    const [aliveCells, setAliveCells] = useState<string[]>(defaultMatrix.aliveCells);
    const [gameSpeed, setGameSpeed] = useState<number>(GAME_SPEED.NORMAL);
    const [matrix, setMatrix] = useState<JSX.Element[]>();

    const fileChange = (): void => {
        setGameSpeed(0);
    };

    const fileReadSuccess = (generation: number, rows: number, cols: number, aliveCells: string[]): void => {
        setGeneration(generation);
        setNumberOfRows(rows);
        setNumberOfCols(cols);
        setAliveCells(aliveCells);
    };

    // This handler is called by the NEXT button, so we stop the simulation in case the user wants to proceed step by step
    const nextGeneration = (): void => {
        setGameSpeed(GAME_SPEED.PAUSE);
        runGame();
    };

    // When removing rows or cols, we also kill any cell that resides on one of the removed cell, to ensure that is does not affect the count of its neighbours
    const editMatrix = (action: EDIT_MATRIX): void => {
        setGameSpeed(GAME_SPEED.PAUSE);

        switch (action) {
            case EDIT_MATRIX.ADD_ROW:
                setNumberOfRows(numberOfRows + 1);
                break;
            case EDIT_MATRIX.REMOVE_ROW:
                setAliveCells(
                    aliveCells.filter((cell: string) => {
                        const cellRow = cell.split('|').map((coord: string) => {
                            return +coord;
                        })[0];

                        return cellRow !== numberOfRows - 1;
                    })
                );
                setNumberOfRows(numberOfRows - 1);
                break;
            case EDIT_MATRIX.ADD_COL:
                setNumberOfCols(numberOfCols + 1);
                break;
            case EDIT_MATRIX.REMOVE_COL:
                setAliveCells(
                    aliveCells.filter((cell: string) => {
                        const cellCol = cell.split('|').map((coord: string) => {
                            return +coord;
                        })[1];

                        return cellCol !== numberOfCols - 1;
                    })
                );
                setNumberOfCols(numberOfCols - 1);
                break;
            case EDIT_MATRIX.RESET:
                setAliveCells([]);
                setGeneration(0);
                break;
        }
    };

    // We can click on the cells to toggle their status. The key is passed to each cell when the matrix is generated
    const toggleCell = useCallback(
        (key: string): void => {
            const isCellAlive = aliveCells.includes(key);

            if (isCellAlive) {
                setAliveCells(
                    aliveCells.filter((aliveCellKey: string) => {
                        return aliveCellKey !== key;
                    })
                );
            } else {
                setAliveCells([...aliveCells, key]);
            }
        },
        [aliveCells]
    );

    // This is a single game cycle, not the loop
    const runGame = useCallback((): void => {
        // For each alive cell, we add 1 to the counter of its neighbours. We keep track of this counter in a Map which has the cell coordinates as the key (always in the format row|col) and the counter as the value.
        const neighboursCount = new Map<string, number>();

        aliveCells.forEach((aliveCellKey: string) => {
            const [cellRow, cellCol] = aliveCellKey.split('|').map((coord: string) => {
                return +coord;
            });
            NEIGHBOURS_MATRIX.forEach(([rowMod, colMod]) => {
                const [neighbourRow, neighbourCol] = [cellRow + rowMod, cellCol + colMod];

                // Checking for boundaries
                if (
                    neighbourRow < 0 ||
                    neighbourRow >= numberOfRows ||
                    neighbourCol < 0 ||
                    neighbourCol >= numberOfCols
                ) {
                    return;
                }

                const currentNeighbourKey = `${neighbourRow}|${neighbourCol}`;
                neighboursCount.set(currentNeighbourKey, (neighboursCount.get(currentNeighbourKey) || 0) + 1);
            });
        });

        const updatedAliveCells: string[] = [];

        // Here we apply the game rules
        neighboursCount.forEach((neighboursAlive: number, currentNeighbourKey: string) => {
            if (neighboursAlive < 2 || neighboursAlive > 3) {
                return;
            }

            if (neighboursAlive === 2 && aliveCells.includes(currentNeighbourKey)) {
                updatedAliveCells.push(currentNeighbourKey);
            }

            if (neighboursAlive === 3) {
                updatedAliveCells.push(currentNeighbourKey);
            }
        });

        setAliveCells(updatedAliveCells);
        setGeneration(generation + 1);
    }, [numberOfRows, numberOfCols, generation, aliveCells]);

    // Game loop
    useEffect(() => {
        const gameLoop = setInterval(() => {
            if (gameSpeed === GAME_SPEED.PAUSE) {
                return;
            }

            runGame();
        }, 1000 / gameSpeed);

        return () => {
            clearInterval(gameLoop);
        };
    }, [gameSpeed, runGame]);

    // The matrix. Follow the white rabbit.
    useEffect(() => {
        setMatrix(
            // We said we don't like for loops, right? :D
            new Array(numberOfRows)
                .fill(null)
                .map((x: any, r: number) => {
                    return new Array(numberOfCols).fill(null).map((y: any, c: number) => {
                        const key = `${r}|${c}`;

                        return (
                            <button
                                className={styles.Board__Cell}
                                key={key}
                                data-alive={aliveCells.includes(key)}
                                onClick={() => toggleCell(key)}
                            >
                                {/* DEBUG - uncomment these spans to show cell coordinates */}
                                {/* <span>{r}</span>
                                <span>{c}</span> */}
                            </button>
                        );
                    });
                })
                .flat()
        );
    }, [numberOfRows, numberOfCols, aliveCells, toggleCell]);

    return (
        <div className={styles.App}>
            <main className={styles.App__Main}>
                <div
                    className={styles.Board}
                    style={{
                        gridTemplateRows: `repeat(${numberOfRows}, 1fr)`,
                        gridTemplateColumns: `repeat(${numberOfCols}, 1fr)`,
                    }}
                >
                    {matrix}
                </div>
            </main>
            <aside className={styles.App__Controls}>
                <div className={styles.Toolbar}>
                    <div className={styles.Toolbar__Panel}>
                        <div className={styles.Toolbar__Generation}>
                            Generation
                            <br /> {generation}
                        </div>
                    </div>
                    <div className={styles.Toolbar__Buttons}>
                        <button
                            className={styles.Toolbar__Button}
                            onClick={() => setGameSpeed(GAME_SPEED.PAUSE)}
                            data-toggled={gameSpeed === GAME_SPEED.PAUSE}
                        >
                            Pause
                        </button>
                        <button
                            className={styles.Toolbar__Button}
                            onClick={() => setGameSpeed(GAME_SPEED.NORMAL)}
                            data-toggled={gameSpeed === GAME_SPEED.NORMAL}
                        >
                            Play
                        </button>
                        <button
                            className={styles.Toolbar__Button}
                            onClick={() => setGameSpeed(GAME_SPEED.FASTER)}
                            data-toggled={gameSpeed === GAME_SPEED.FASTER}
                        >
                            Faster
                        </button>
                        <button
                            className={styles.Toolbar__Button}
                            onClick={() => setGameSpeed(GAME_SPEED.FASTEST)}
                            data-toggled={gameSpeed === GAME_SPEED.FASTEST}
                        >
                            Fastest
                        </button>
                        <button className={styles.Toolbar__Button} onClick={nextGeneration}>
                            Next
                        </button>
                        <button className={styles.Toolbar__Button} onClick={() => editMatrix(EDIT_MATRIX.ADD_ROW)}>
                            Row +
                        </button>
                        <button className={styles.Toolbar__Button} onClick={() => editMatrix(EDIT_MATRIX.REMOVE_ROW)}>
                            Row -
                        </button>
                        <button className={styles.Toolbar__Button} onClick={() => editMatrix(EDIT_MATRIX.ADD_COL)}>
                            Col +
                        </button>
                        <button className={styles.Toolbar__Button} onClick={() => editMatrix(EDIT_MATRIX.REMOVE_COL)}>
                            Col -
                        </button>
                        <button className={styles.Toolbar__Button} onClick={() => editMatrix(EDIT_MATRIX.RESET)}>
                            Reset
                        </button>
                    </div>

                    <div className={styles.Toolbar__Panel}>
                        <TextReader
                            onFileChange={fileChange}
                            onFileReadSuccess={(generation: number, rows: number, cols: number, aliveCells: string[]) =>
                                fileReadSuccess(generation, rows, cols, aliveCells)
                            }
                        />
                    </div>
                </div>
            </aside>
        </div>
    );
};

export default App;

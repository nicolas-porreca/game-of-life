import React, { SyntheticEvent, useRef, useState } from 'react';
import styles from './TextReader.module.scss';

type TextReaderProps = {
    onFileChange: () => void;
    onFileReadSuccess: (generation: number, rows: number, cols: number, aliveCells: string[]) => void;
};

const TextReader: React.FC<TextReaderProps> = (props: TextReaderProps) => {
    const isFileReaderSupported = window.File && window.FileReader && window.FileList && window.Blob;

    const [invalidFile, setInvalidFile] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const invalidFileNotification = (): void => {
        setInvalidFile(true);
    };

    const readInputFile = (event: SyntheticEvent): void => {
        setInvalidFile(false);
        props.onFileChange();

        const reader = new FileReader();
        const file = fileInputRef.current?.files?.[0];

        reader.onload = (event: ProgressEvent<FileReader>): void => {
            const text: string | undefined = event.target?.result?.toString();
            if (!text) {
                return invalidFileNotification();
            }

            validateAndParseInput(text);
        };

        if (file) {
            reader.readAsText(file);
        }
    };

    const validateAndParseInput = (text: string) => {
        const inputArray: string[] = text.split('\n').filter((line: string) => {
            return line.length > 0;
        });

        const generation: number | null = +inputArray[0].substring(11, inputArray[0].length - 1) || null;
        if (!generation) {
            return invalidFileNotification();
        }

        const [rows, cols]: (number | null)[] = inputArray[1].split(' ').map((value: string) => {
            return +value || null;
        });
        if (!rows || !cols) {
            return invalidFileNotification();
        }

        const lines: string[] = inputArray.slice(2);
        if (
            lines.length !== rows ||
            lines.find((line: string) => {
                return line.length !== cols;
            })
        ) {
            return invalidFileNotification();
        }

        const aliveCells: string[] = [];
        lines.forEach((line: string, row: number) => {
            line.split('').forEach((char: string, col: number) => {
                if (char !== '.' && char !== '*') {
                    return invalidFileNotification();
                }

                if (char === '*') {
                    aliveCells.push(`${row}|${col}`);
                }
            });
        });

        props.onFileReadSuccess(generation, rows, cols, aliveCells);
    };

    return (
        <div className={styles.fileReader} data-disabled={!isFileReaderSupported} data-invalid={invalidFile}>
            {isFileReaderSupported ? (
                <>
                    <input
                        id="file-upload"
                        className={styles.fileReader__input}
                        ref={fileInputRef}
                        type="file"
                        accept="text/plain"
                        onChange={readInputFile}
                    />
                    <div className={styles.messages}>
                        {invalidFile ? <span className={styles.fileReader__invalid}>Invalid file!</span> : null}
                        <span className={styles.fileReader__hint}>
                            Drag text file here
                            <br /> or click to select
                        </span>
                    </div>
                </>
            ) : (
                <span className={styles.fileReader__notSupported}>File reader not supported in your browser</span>
            )}
        </div>
    );
};

export default TextReader;

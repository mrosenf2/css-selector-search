import { PathLike, readFileSync, readdirSync, statSync } from "fs";
import * as path from "path";
import * as cheerio from "cheerio";
import { Position, Range, workspace } from "vscode";
import { readFile } from "fs/promises";


/**
 * Root path of folder open in the editor. `undefined` when no workspace has been opened.
 *
 * Refer to https://code.visualstudio.com/docs/editor/workspaces for more information
 * on workspaces.
 */
export function getRootPath() {
    const workspaceFolders = workspace.workspaceFolders;
    const rootPath = workspaceFolders?.length ? workspaceFolders[0].uri.fsPath : undefined;
    return rootPath;
}

export function getAllFiles(dir: string): string[] {
    if (statSync(dir).isFile()) {
        return [dir.toString()];
    } else if (statSync(dir).isDirectory()) {
        if (dir.includes("node_modules")) {
            return [];
        }
        const files = readdirSync(dir);
        return files.flatMap((file) => {
            const name = path.join(dir, file);
            return getAllFiles(name);
        });
    }

    return [];
}

export function readToCheerio(file: string) {
    const buffer = readFileSync(file);
    return cheerio.load(
        buffer,
        {
            xmlMode: true,
            lowerCaseAttributeNames: false,
            withStartIndices: true,
            withEndIndices: true,
        },
        false
    );
}
export async function readToCheerioAsync(file: string) {
    const buffer = await readFile(file);
    return cheerio.load(
        buffer,
        {
            xmlMode: true,
            lowerCaseAttributeNames: false,
            withStartIndices: true,
            withEndIndices: true,
        },
        false
    );
}

export function searchFile(file: string, selector: string) {
    const $ = readToCheerio(file);
    const html = readFileSync(file, {
        encoding: "utf-8",
    });
    const s = $(selector);
    let results: Range[] = [];
    s.each((i, el) => {
        const start = el.startIndex || 0;
        const end = el.endIndex || 0;
        const lineNumberStart = html.substring(0, start).split("\n").length - 1;
        const colNumberStart = html.substring(0, start).split("\n").pop()?.length || 0;
        const lineNumberEnd = html.substring(0, end).split("\n").length - 1;
        const colNumberEnd = html.substring(0, end).split("\n").pop()?.length || 0;
        results.push(
            new Range(
                new Position(lineNumberStart, colNumberStart),
                new Position(lineNumberEnd, colNumberEnd + 1)
            )
        );
    });
    // console.log(s);
    return results;
}

export async function searchFileAsync(file: string, selector: string) {
    const $ = await readToCheerioAsync(file);
    const html = await readFile(file, "utf-8");
    const s = $(selector);
    let results: Range[] = [];
    s.each((i, el) => {
        const start = el.startIndex || 0;
        const end = el.endIndex || 0;
        const lineNumberStart = html.substring(0, start).split("\n").length - 1;
        const colNumberStart = html.substring(0, start).split("\n").pop()?.length || 0;
        const lineNumberEnd = html.substring(0, end).split("\n").length - 1;
        const colNumberEnd = html.substring(0, end).split("\n").pop()?.length || 0;
        results.push(
            new Range(
                new Position(lineNumberStart, colNumberStart),
                new Position(lineNumberEnd, colNumberEnd + 1)
            )
        );
    });
    // console.log(s);
    return results;
}

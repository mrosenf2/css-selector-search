/* eslint-disable curly */

import * as vscode from "vscode";
import * as path from "path";

export interface SearchResult {
    range: vscode.Range;
    filePath: string;
}

/**
 * Virtual File System Tree node
 */
export type VFSTreeNode = {
    name: string;
    relativePath: string;
    children: VFSTreeNode[];
    data?: SearchResult[];
};

export function insert(root: VFSTreeNode, relativePath: string, results: SearchResult[]) {
    const arrRelativePath = relativePath.split("\\");
    const dirName = path.dirname(relativePath);
    const itemName = arrRelativePath[0];
    const newPath = arrRelativePath.slice(1).join("\\");

    const child = root.children.find((c) => {
        return c.name === itemName;
    });

    if (child) {
        return insert(child, newPath, results);
    }

    const newNode: VFSTreeNode = {
        name: arrRelativePath[0],
        relativePath: path.join(root.relativePath, arrRelativePath[0]),
        children: [],
    };

    if (arrRelativePath.length !== 1 && !results) {
        throw new Error("unexpected");
    }

    if (arrRelativePath.length === 1) {
        newNode.data = results;
        root.children.push(newNode);
        return newNode;
    } else {
        root.children.push(newNode);
        return insert(newNode, newPath, results);
    }
}

interface VFSTreeNodeResultsSummary {
    files: number;
    results: number;
}

export function countResults(node: VFSTreeNode): VFSTreeNodeResultsSummary {
    if (node.data) {
        return {
            files: 0,
            results: node.data.length,
        };
    } else {
        let results = {
            files: 0,
            results: 0,
        };
        for (const child of node.children) {
            let childResults = countResults(child);
            results.files += 1 + childResults.files;
            results.results += childResults.results;
        }
        return results;
    }
}

export function foldTree(root: VFSTreeNode) {
    if (root.children.length === 0) return;
    if (root.children.length === 1) {
        const child = root.children[0];
        root.name = child.name;
        root.relativePath = child.relativePath;
        root.children = child.children;
        root.data = child.data;
        foldTree(root);
    } else {
        for (const child of root.children) {
            foldTree(child);
        }
    }
}

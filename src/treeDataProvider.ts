import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { getAllFiles, searchFile } from "./util";
import { SearchResult, VFSTreeNode, countResults, foldTree, insert } from "./VFSTreeNode";
import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode";

export class CssSelectorSearchProvider
    implements vscode.TreeDataProvider<TI_SearchResultFile | TI_SearchResult>
{
    constructor(private workspaceRoot: string, private searchQuery: string) {
        console.log(workspaceRoot);
    }

    getTreeItem(element: TI_SearchResultFile | TI_SearchResult): TreeItem {
        return element;
    }

    createFileTree(results: SearchResult[]) {
        let items: VFSTreeNode[] = [];
        var paths = new Set(results.map((r) => r.filePath));
        for (const path of paths) {
        }
    }

    getChildren(
        element?: TI_SearchResultFile
    ): vscode.ProviderResult<TI_SearchResultFile[] | TI_SearchResult[]> {
        if (!this.workspaceRoot) {
            vscode.window.showInformationMessage("No Workspace");
            return [];
        }
        let results: SearchResult[] = [];
        if (!element) {
            const files = getAllFiles(this.workspaceRoot).filter((f) => f.endsWith("html"));
            const rootNode: VFSTreeNode = {
                name: this.workspaceRoot,
                relativePath: "",
                children: [],
            };
            for (const file of files) {
                var result = searchFile(file, this.searchQuery);
                let searchResults = result.map((r) => ({
                    filePath: file,
                    range: r,
                }));
                if (result && result.length) {
                    insert(rootNode, file, searchResults);
                }
            }
            foldTree(rootNode);
            return rootNode.children.map((r) => new TI_SearchResultFile(r));
        } else {
            return element.getChildren();
        }
    }

    private pathExists(p: string): boolean {
        try {
            fs.accessSync(p);
        } catch (err) {
            return false;
        }
        return true;
    }
}

/**
 * Tree Item representing a folder or file containing search results
 */
class TI_SearchResultFile extends TreeItem {
    constructor(public readonly treeNode: VFSTreeNode) {
        super(vscode.Uri.file(treeNode.relativePath), TreeItemCollapsibleState.Collapsed);
        this.tooltip = this.resourceUri?.path;
        // this.iconPath = ThemeIcon.File;
        let resultsSummary = countResults(treeNode);
        if (resultsSummary.files) {
            this.description = `${resultsSummary.files} files | ${resultsSummary.results} results`;
        } else {
            this.description = `${resultsSummary.results} results`;
        }
    }

    getChildren() {
        if (this.treeNode.data) {
            return this.treeNode.data.map((result) => {
                return new TI_SearchResult(result.filePath, result.range);
            });
        } else {
            return this.treeNode.children.map((result) => {
                return new TI_SearchResultFile(result);
            });
        }
    }
}

/**
 * Tree Item representing a specific search results
 */
class TI_SearchResult extends TreeItem {
    constructor(public readonly filepath: string, public readonly range: vscode.Range) {
        super(vscode.Uri.file(filepath), TreeItemCollapsibleState.None);
        this.tooltip = this.resourceUri?.path;
        this.iconPath = vscode.ThemeIcon.File;

        var opts: vscode.TextDocumentShowOptions = {
            selection: range,
        };
        this.command = {
            title: "Open",
            command: "vscode.openWith",
            arguments: [this.resourceUri, "default", opts],
        };
    }
}

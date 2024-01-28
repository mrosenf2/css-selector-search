import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { getAllFiles, searchFile } from "./util";
import { SearchResult, VFSTreeNode, countResults, foldTree, insert } from "./VFSTreeNode";
import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode";

type TreeViewItem = TI_SearchResultFile | TI_SearchResult;
export class CssSelectorSearchProvider
    implements vscode.TreeDataProvider<TreeViewItem>
{
    constructor() {
    }

    /**
     * Assign current root path to tree data provider
     * @param root RootPath currently opened
     */
    activate(root: string) {
        this.workspaceRoot = root;
    }

    performSearch(searchQuery?: string) {
        this.searchQuery = searchQuery || this.searchQuery;
        this._onDidChangeTreeData.fire();
    }

    // beginPerformSearch() {
    //     // scan directory for search results
    //     const files = getAllFiles(this.workspaceRoot).filter((f) => f.endsWith("html"));
    //     for (const file of files) {
    //         var result = searchFile(file, this.searchQuery);
    //         let searchResults = result.map((r) => ({
    //             filePath: file,
    //             range: r,
    //         }));
    //         // when found, fire treeview update
    //         if (result && result.length) {
    //             insert(rootNode, file, searchResults);
    //         }
    //     }

        
    // }

    private workspaceRoot: string = "";
    private searchQuery: string = "";

    getTreeItem(element: TreeViewItem): TreeItem {
        return element;
    }

    createFileTree(results: SearchResult[]) {
        let items: VFSTreeNode[] = [];
        var paths = new Set(results.map((r) => r.filePath));
        for (const path of paths) {
        }
    }

    rootSearchResults: TI_SearchResultFile[] = [];

    getChildren(
        element?: TI_SearchResultFile
    ): vscode.ProviderResult<TreeViewItem[]> {
        if (!this.workspaceRoot) {
            vscode.window.showInformationMessage("No Workspace");
            return [];
        }
        if (!this.searchQuery) {
            return undefined;
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
            if (!rootNode.children?.length) { return [new TI_SearchResultFile(undefined, rootNode)]; }
            return rootNode.children.map((r) => new TI_SearchResultFile(undefined, r));
        } else {
            return element.getChildren();
        }
    }

    private _onDidChangeTreeData: vscode.EventEmitter<TreeViewItem | undefined | null | void> = new vscode.EventEmitter<TreeViewItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeViewItem | undefined | null | void> = this._onDidChangeTreeData.event;

    removeTreeeItem(item: TreeViewItem) {
        if (item.parent) {
            item.parent.removeChild(item);
            this._onDidChangeTreeData.fire(item.parent);
        }
        else {
            this._onDidChangeTreeData.fire();
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
    constructor(public readonly parent: TI_SearchResultFile | undefined, public readonly treeNode: VFSTreeNode) {
        super(vscode.Uri.file(treeNode.relativePath), TreeItemCollapsibleState.Collapsed);
        this.tooltip = this.resourceUri?.path;
        this.iconPath = ThemeIcon.File;
        this.id = getUniqueId();
        let resultsSummary = countResults(treeNode);
        if (resultsSummary.files) {
            this.description = `${resultsSummary.files} files | ${resultsSummary.results} results`;
        } else {
            this.description = `${resultsSummary.results} results`;
        }
    }

    getChildren() {
        if (this.children) { return this.children; }
        if (this.treeNode.data) {
            this.children = this.treeNode.data.map((result) => {
                return new TI_SearchResult(this, result.filePath, result.range);
            });
        } else {
            this.children = this.treeNode.children.map((result) => {
                return new TI_SearchResultFile(this, result);
            });
        }
        return this.children;
    }

    private children: TreeViewItem[] | undefined = undefined;

    removeChild(item: TreeViewItem) {
        console.log(`removing ${item.id}`);
        this.children = this.children?.filter(x => x.id !== item.id);
    }
}


let id = 0;
export function getUniqueId(): string {
    return id++ + '';
}

/**
 * Tree Item representing a specific search results
 */
class TI_SearchResult extends TreeItem {
    constructor(public readonly parent: TI_SearchResultFile, public readonly filepath: string, public readonly range: vscode.Range) {
        super(vscode.Uri.file(filepath), TreeItemCollapsibleState.None);
        this.tooltip = this.resourceUri?.path;
        this.iconPath = vscode.ThemeIcon.File;
        this.id = getUniqueId();

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
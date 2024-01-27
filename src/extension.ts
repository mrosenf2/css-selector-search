// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { CssSelectorSearchProvider } from "./treeDataProvider";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    const rootPath =
        vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
            ? vscode.workspace.workspaceFolders[0].uri.fsPath
            : undefined;

    if (rootPath) {
        const commands: { [key: string]: (...args: any[]) => any; } = {
            performSearch: performSearch.bind(null, rootPath),
            refreshSearch: refreshSearch,
            toggleView: toggleView
        };

        for (const key in commands) {
            const command = commands[key];
            context.subscriptions.push(
                vscode.commands.registerCommand(`cssSelectorSearch.${key}`, command)
            );
        }

        // treeView.reveal()
    }
}

async function performSearch(rootPath: string) {
    var searchQuery = await vscode.window.showInputBox({
        prompt: "search",
    });
    if (searchQuery) {
        const provider = new CssSelectorSearchProvider(rootPath, searchQuery);
        const treeView = vscode.window.createTreeView("cssSelectorSearchResults", {
            treeDataProvider: provider,
            showCollapseAll: true,
        });
        vscode.commands.registerCommand(`cssSelectorSearch.removeResult`, (item) => {
            provider.removeTreeeItem(item);
        });
    }
}



function toggleView() {
    throw new Error("not implemented");
}
function refreshSearch() {
    throw new Error("not implemented");
}

// This method is called when your extension is deactivated
export function deactivate() { }

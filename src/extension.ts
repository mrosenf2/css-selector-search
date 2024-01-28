// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { CssSelectorSearchProvider } from "./treeDataProvider";
import { getRootPath } from "./util";

/**
 * static instance of vscode.TreeDataProvider to display search results, instantiated once during activation
 */
const provider = new CssSelectorSearchProvider();




// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    const rootPath = getRootPath();
    if (rootPath) {

        provider.activate(rootPath);

        vscode.window.createTreeView("cssSelectorSearchResults", {
            treeDataProvider: provider,
            showCollapseAll: true,
        });

        const commands: { [key: string]: (...args: any[]) => any; } = {
            performSearch: performSearch,
            refreshSearch: refreshSearch,
            toggleView: toggleView,
            removeResult: removeResult
        };

        for (const key in commands) {
            const command = commands[key];
            context.subscriptions.push(
                vscode.commands.registerCommand(`cssSelectorSearch.${key}`, command)
            );
        }
    }
}

async function performSearch() {
    var searchQuery = await vscode.window.showInputBox({
        prompt: "search",
    });
    if (searchQuery) {
        provider.performSearch(searchQuery);
    }
}

function removeResult(item: any) {
    provider.removeTreeeItem(item);
}


function toggleView() {
    throw new Error("not implemented");
}
function refreshSearch() {
    provider.performSearch();
}

// This method is called when your extension is deactivated
export function deactivate() { }

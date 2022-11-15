import * as vscode from 'vscode';
import 'isomorphic-fetch';

export function activate(context: vscode.ExtensionContext) {

	const citeProvider = vscode.languages.registerCompletionItemProvider('bibtex', {
		async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
			const linePrefix = document.lineAt(position).text;

			// check if cite query
			if (!linePrefix.startsWith('cite ')) {
				return;
			}

			// extract and form query
			const query = linePrefix.replace(/^cite /, '').replace('.', '').replace(/ /g, '+').trim();

			// send request
			const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${query}&limit=10&fields=citationStyles,authors,title`;

			// get start and end of replace line
			const start = document.lineAt(position).range.start;
			try {
				const request = await fetch(url);
				const { data } = await request.json();
				return buildCompletionList(data, start, position);
			} catch (e) {
				return [];
			}
		}	
	}, '.');

	context.subscriptions.push(citeProvider);
}

function buildCompletionList(papers: Array<Paper>, start: vscode.Position, end: vscode.Position) {
	// build completion items
	const completionItems = [];

	for (const paper of papers) {
		const completionItem = new vscode.CompletionItem(paper.title, vscode.CompletionItemKind.Reference);
		completionItem.insertText = paper.citationStyles.bibtex;
		completionItem.additionalTextEdits = [vscode.TextEdit.delete(new vscode.Range(start, end))];
		completionItems.push(completionItem);
	}

	return completionItems;
}
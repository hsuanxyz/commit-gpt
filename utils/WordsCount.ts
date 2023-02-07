export function wordsCount(str: string): number {
    const matches = str.match(/[\u00ff-\uffff]|\S+/g);
    return matches ? matches.length : 0;
}

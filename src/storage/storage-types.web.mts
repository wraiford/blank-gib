/**
 * used to mimic the fs.Dirent interface.
 * @see https://nodejs.org/api/fs.html#fs_class_fs_dirent
 */
export interface Dirent {
    name: string;
    isDirectory(): boolean;
    isFile(): boolean;
    /**
     * Always false for IndexedDB
     */
    isBlockDevice(): boolean;
    /**
     * Always false for IndexedDB
     */
    isCharacterDevice(): boolean;
    /**
     * Always false for IndexedDB
     */
    isSymbolicLink(): boolean;
    /**
     * Always false for IndexedDB
     */
    isFIFO(): boolean;
    /**
     * Always false for IndexedDB
     */
    isSocket(): boolean;
}

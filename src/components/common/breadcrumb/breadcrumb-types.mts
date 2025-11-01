
export interface BreadcrumbInfo {
    text: string;
    type: 'IbGibAddr' | string;
    fnClickAction?: () => Promise<void>;
}

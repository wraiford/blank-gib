// Tell TypeScript that importing a .html file will return a string.
declare module '*.html' {
  const value: string;
  export default value;
}

// Tell TypeScript that importing a .css file will return a string.
declare module '*.css' {
  const value: string;
  export default value;
}

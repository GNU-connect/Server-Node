/** Metro / expo-font: font assets resolve to a numeric module id */
declare module '*.ttf' {
  const value: number;
  export default value;
}

/**
 * Convert array of objects to x-data-spreadsheet grid format.
 */
export function arrToSheetData(arr) {
  if (!arr || arr.length === 0) return { rows: { len: 1 }, cols: { len: 5 }, cells: {} }
  const keys = Object.keys(arr[0])
  const cells = {}
  // header row
  keys.forEach((k, ci) => { cells[`0_${ci}`] = { text: k } })
  // data rows
  arr.forEach((row, ri) => {
    keys.forEach((k, ci) => {
      const val = row[k]
      cells[`${ri + 1}_${ci}`] = { text: val != null ? String(val) : "" }
    })
  })
  return { rows: { len: arr.length + 10 }, cols: { len: Math.max(keys.length, 10) }, cells }
}

/**
 * Convert x-data-spreadsheet cells data back to array of objects.
 */
export function sheetDataToArr(sheetData) {
  if (!sheetData || !sheetData.cells) return []
  const cells = sheetData.cells
  const rows = sheetData.rows?.len || 100
  const cols = sheetData.cols?.len || 26

  // find headers from row 0
  const headers = {}
  for (let c = 0; c < cols; c++) {
    const cell = cells[`0_${c}`]
    if (cell && cell.text) headers[c] = cell.text
  }
  const headerKeys = Object.keys(headers)
  if (headerKeys.length === 0) return []

  const result = []
  for (let r = 1; r < rows; r++) {
    const row = {}
    let hasData = false
    headerKeys.forEach(c => {
      const cell = cells[`${r}_${c}`]
      const key = headers[c]
      if (cell && cell.text != null && cell.text !== "") {
        row[key] = cell.text
        hasData = true
      }
    })
    if (hasData) result.push(row)
  }
  return result
}

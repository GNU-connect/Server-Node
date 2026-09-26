/** [시작, 종료, "[분류] 내용"] 목록을 selectSchdulList.do 응답 형태(JSON 문자열로 감싼 HTML)로 만든다. */
export function scheduleResponse(
  items: Array<[start: string, end: string, label: string]>,
): string {
  const rows = items
    .map(
      ([start, end, label], index) =>
        `<tr><td class="nowrap"><span>${start}</span> ~ <span>${end}</span></td>` +
        `<td><a href="javascript:viewSchdulInfo('${1000 + index}', '${start}', '${end}', '#CBD3E7');">${label}</a></td></tr>`,
    )
    .join('\n');

  return JSON.stringify(
    `<div class='tbl_tbody_year'><table><tbody>${rows}</tbody></table></div>`,
  );
}

import { Injectable } from '@nestjs/common';
import {
  ParsedShuttleTimetable,
  ShuttleTimetableMap,
} from './type/parsed-shuttle-timetable';

@Injectable()
export class ShuttleParser {
  parse(raw: string): ParsedShuttleTimetable[] {
    return this.extractTables(raw)
      .map((table) => this.parseTable(table))
      .filter((timetable): timetable is ParsedShuttleTimetable => timetable !== null);
  }

  private parseTable(table: string): ParsedShuttleTimetable | null {
    const rows = this.extractRows(table);
    const headerIndex = rows.findIndex((row) => {
      const headers = this.extractCells(row, 'th');

      return headers.includes('오전') && headers.includes('오후');
    });

    if (headerIndex === -1) {
      return null;
    }

    const routeName = this.extractRouteName(rows.slice(0, headerIndex));

    if (!routeName) {
      return null;
    }

    const timeGroups = this.extractCells(rows[headerIndex], 'th');
    const timetable = rows.slice(headerIndex + 1).reduce<ShuttleTimetableMap>(
      (acc, row) => {
        const times = this.extractCells(row, 'td', { removeEmpty: false });

        timeGroups.forEach((timeGroup, index) => {
          const time = times[index];

          if (!time) {
            return;
          }

          acc[timeGroup] = [...(acc[timeGroup] ?? []), time];
        });

        return acc;
      },
      {},
    );

    return { routeName, timetable };
  }

  private extractTables(raw: string): string[] {
    return raw.match(/<table\b[\s\S]*?<\/table>/gi) ?? [];
  }

  private extractRows(table: string): string[] {
    return table.match(/<tr\b[\s\S]*?<\/tr>/gi) ?? [];
  }

  private extractCells(
    row: string,
    tagName: 'td' | 'th',
    options: { removeEmpty?: boolean } = { removeEmpty: true },
  ): string[] {
    const cellRegex = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
    const cells = [...row.matchAll(cellRegex)];
    const texts = cells.map((cell) => this.normalizeText(cell[1]));

    if (options.removeEmpty === false) {
      return texts;
    }

    return texts.filter((cell) => cell.length > 0);
  }

  private extractRouteName(rows: string[]): string | null {
    for (const row of rows) {
      const routeName = this.extractCells(row, 'th')[0]
        ?.split('\n')[0]
        ?.replace(/\s*\(출발지:[^)]+\).*$/, '')
        .trim();

      if (routeName?.includes('→')) {
        return routeName;
      }
    }

    return null;
  }

  private normalizeText(html: string): string {
    return this.decodeHtmlEntities(html)
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, ' ')
      .replace(/[ \t\r\f\v]+/g, ' ')
      .replace(/ *\n */g, '\n')
      .replace(/(\d{1,2})\s*:\s*(\d)\s+(\d)/g, '$1:$2$3')
      .replace(/(\d{1,2})\s*:\s*(\d{2})/g, '$1:$2')
      .replace(/\s+(\([^)]*\))/g, ' $1')
      .trim();
  }

  private decodeHtmlEntities(text: string): string {
    return text
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'");
  }
}

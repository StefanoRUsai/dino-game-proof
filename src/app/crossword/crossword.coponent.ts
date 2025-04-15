// File: crossword.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Cell {
  row: number;
  col: number;
  value: string;
  solution: string;
  isBlack: boolean;
  clueNumber?: number;
}

interface Clue {
  direction: 'across' | 'down';
  number: number;
  text: string;
  startRow: number;
  startCol: number;
}

function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

@Component({
  selector: 'app-crossword',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crossword.component.html',
  styleUrls: ['./crossword.component.css'],
})
export class CrosswordComponent implements OnInit {
  grid: Cell[][] = [];
  size = 13;
  clues: Clue[] = [];
  bestGrid: Cell[][] = [];
  bestClues: Clue[] = [];
  bestCount = 0;

  wordList = [
    { word: 'ANGULAR', clue: 'Framework front-end' },
    { word: 'TYPESCRIPT', clue: 'Superset di JavaScript' },
    { word: 'COMPONENT', clue: 'Unità base di Angular' },
    { word: 'HTML', clue: 'Linguaggio di markup' },
    { word: 'CSS', clue: 'Linguaggio di stile' },
    { word: 'SERVICE', clue: 'Gestisce logica condivisa' },
    { word: 'ROUTER', clue: 'Sistema di navigazione' },
    { word: 'MODULE', clue: 'Contenitore di componenti' },
    { word: 'INPUT', clue: 'Decoratore per proprietà' },
    { word: 'OUTPUT', clue: 'Evento in uscita' },
    { word: 'TEMPLATE', clue: 'Struttura HTML di un componente' },
    { word: 'DIRECTIVE', clue: 'Modifica il DOM' },
    { word: 'PIPE', clue: 'Trasforma valori in output' },
    { word: 'INJECTOR', clue: 'Gestisce le dipendenze' },
    { word: 'SUBSCRIBE', clue: 'Metodo per osservare Observable' },
    { word: 'NAVIGATION', clue: 'Cambio pagina' },
    { word: 'REACTIVE', clue: 'Tipo di form in Angular' },
    { word: 'DECORATOR', clue: 'Annotazione speciale in TypeScript' },
    { word: 'ZONJS', clue: 'Controlla il rilevamento dei cambi' },
    { word: 'OBSERVABLE', clue: 'Flusso di dati asincroni' },
  ];

  ngOnInit(): void {
    this.generateGrid();
    const sortedWords = shuffleArray([...this.wordList]).sort(
      (a, b) => b.word.length - a.word.length
    );
    this.backtrackPlacement(0, sortedWords, 1);
    this.grid = this.bestGrid;
    this.clues = this.bestClues;
    console.log(`Parole piazzate: ${this.bestCount}`);
  }

  generateGrid(): Cell[][] {
    const grid: Cell[][] = [];
    for (let i = 0; i < this.size; i++) {
      const row: Cell[] = [];
      for (let j = 0; j < this.size; j++) {
        row.push({ row: i, col: j, value: '', solution: '', isBlack: false });
      }
      grid.push(row);
    }
    return grid;
  }

  backtrackPlacement(
    index: number,
    words: { word: string; clue: string }[],
    clueNumber: number,
    grid?: Cell[][],
    clues?: Clue[]
  ): void {
    if (index >= words.length) {
      if (index > this.bestCount) {
        this.bestCount = index;
        this.bestGrid = JSON.parse(JSON.stringify(grid));
        this.bestClues = [...(clues || [])];
      }
      return;
    }

    if (!grid) grid = this.generateGrid();
    if (!clues) clues = [];

    const word = words[index].word.toUpperCase();
    const clue = words[index].clue;

    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        for (const dir of ['across', 'down'] as const) {
          if (this.canPlaceWord(word, row, col, dir, grid)) {
            const newGrid = JSON.parse(JSON.stringify(grid));
            const newClues = [...clues];
            this.setWord(
              word,
              clue,
              row,
              col,
              dir,
              clueNumber,
              newGrid,
              newClues
            );
            this.backtrackPlacement(
              index + 1,
              words,
              clueNumber + 1,
              newGrid,
              newClues
            );

            if (this.bestCount === this.wordList.length) return;
          }
        }
      }
    }

    if (index > this.bestCount) {
      this.bestCount = index;
      this.bestGrid = JSON.parse(JSON.stringify(grid));
      this.bestClues = [...clues];
    }
  }

  canPlaceWord(
    word: string,
    row: number,
    col: number,
    dir: 'across' | 'down',
    grid: Cell[][]
  ): boolean {
    if (dir === 'across' && col + word.length >= this.size) return false;
    if (dir === 'down' && row + word.length >= this.size) return false;

    for (let i = 0; i < word.length; i++) {
      const r = dir === 'across' ? row : row + i;
      const c = dir === 'across' ? col + i : col;
      const cell = grid[r][c];
      if (cell.isBlack) return false;
      if (cell.solution && cell.solution !== word[i]) return false;
    }

    return true;
  }

  setWord(
    word: string,
    clue: string,
    row: number,
    col: number,
    dir: 'across' | 'down',
    clueNumber: number,
    grid: Cell[][],
    clues: Clue[]
  ): void {
    for (let i = 0; i < word.length; i++) {
      const r = dir === 'across' ? row : row + i;
      const c = dir === 'across' ? col + i : col;
      const cell = grid[r][c];
      cell.solution = word[i];
      if (i === 0) cell.clueNumber = clueNumber;
    }

    const endRow = dir === 'across' ? row : row + word.length;
    const endCol = dir === 'across' ? col + word.length : col;
    if (endRow < this.size && endCol < this.size) {
      grid[endRow][endCol].isBlack = true;
    }

    clues.push({
      direction: dir,
      number: clueNumber,
      text: clue,
      startRow: row,
      startCol: col,
    });
  }

  checkSolution(): boolean {
    for (const row of this.grid) {
      for (const cell of row) {
        if (
          !cell.isBlack &&
          cell.value.toUpperCase() !== cell.solution.toUpperCase()
        ) {
          return false;
        }
      }
    }
    return true;
  }

  revealSolution(): void {
    for (const row of this.grid) {
      for (const cell of row) {
        if (!cell.isBlack) {
          cell.value = cell.solution;
        }
      }
    }
  }

  getPlacedWordsCount(): number {
    return this.bestCount;
  }

  alert(string: string): any {
    window.alert(string);
  }
}

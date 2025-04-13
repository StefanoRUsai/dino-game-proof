import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  HostListener,
} from '@angular/core';
import { Engine, Runner, Bodies, Body, Composite, Events } from 'matter-js';

@Component({
  selector: 'app-game',
  standalone: true,
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
})
export class GameComponent implements AfterViewInit {
  @ViewChild('gameCanvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private engine!: Engine;
  private runner!: Runner;
  private player!: Body;
  private ground!: Body;
  private obstacles: Body[] = [];
  private obstacleTimer = 0;

  private dinoImg = new Image();
  private cactusImg = new Image();
  private groundTileImg = new Image();

  private imagesLoaded = 0;

  private score = 0;
  private scoreInterval!: ReturnType<typeof setInterval>;
  private gameOver = false;

  private canvasWidth = 800;
  private canvasHeight = 300;
  private groundOffset = 0;
  private groundSpeed = 5;

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;

    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;

    const imagesToLoad = [
      { img: new Image(), src: 'assets/dino.png' },
      { img: new Image(), src: 'assets/cactus.png' },
      { img: new Image(), src: 'assets/ground.png' },
      { img: new Image(), src: 'assets/dino.png' },
    ];

    let loaded = 0;

    imagesToLoad.forEach(({ img, src }, index) => {
      img.onload = () => {
        loaded++;
        if (loaded === imagesToLoad.length) {
          this.dinoImg = imagesToLoad[0].img;
          this.cactusImg = imagesToLoad[1].img;
          this.groundTileImg = imagesToLoad[2].img;
          this.initGame();
        }
      };
      img.onerror = () => {
        console.error(`Errore caricamento: ${src}`);
        loaded++;
        if (loaded === imagesToLoad.length) {
          this.dinoImg = imagesToLoad[0].img;
          this.cactusImg = imagesToLoad[1].img;
          this.groundTileImg = imagesToLoad[2].img;
          this.initGame();
        }
      };
      img.src = src;
    });
  }

  private loadImagesAndStartGame() {
    const checkStart = () => {
      this.imagesLoaded++;
      if (this.imagesLoaded >= 3) this.initGame();
    };

    this.dinoImg.src = 'assets/dino.png';
    this.cactusImg.src = 'assets/cactus.png';
    this.groundTileImg.src = 'assets/ground.png';

    this.dinoImg.onload = checkStart;
    this.dinoImg.onerror = checkStart;

    this.cactusImg.onload = checkStart;
    this.cactusImg.onerror = checkStart;

    this.groundTileImg.onload = checkStart;
    this.groundTileImg.onerror = checkStart;
  }

  private initGame() {
    this.engine = Engine.create();
    this.runner = Runner.create();

    this.player = Bodies.rectangle(100, 240, 30, 30, {
      isStatic: false,
      restitution: 0,
      friction: 0,
      label: 'player',
    });

    this.ground = Bodies.rectangle(400, 290, 800, 20, {
      isStatic: true,
      label: 'ground',
    });

    Composite.add(this.engine.world, [this.player, this.ground]);

    Events.on(this.engine, 'collisionStart', (event) => {
      for (const pair of event.pairs) {
        const labels = [pair.bodyA.label, pair.bodyB.label];
        if (labels.includes('player') && labels.includes('obstacle')) {
          this.gameOver = true;
        }
      }
    });

    Runner.run(this.runner, this.engine);

    this.scoreInterval = setInterval(() => {
      if (!this.gameOver) this.score++;
    }, 100);

    this.gameLoop();
  }

  private gameLoop() {
    if (!this.ctx) return;

    if (this.gameOver) {
      this.ctx.font = '28px Arial';
      this.ctx.fillStyle = 'black';
      this.ctx.fillText('Game Over - Premi Enter per ricominciare', 120, 150);
      return;
    }

    this.drawBackground();
    this.spawnObstaclesLogic();
    this.moveObstacles();
    this.drawEntities();
    this.drawScore();

    requestAnimationFrame(() => this.gameLoop());
  }

  private drawBackground() {
    this.ctx.fillStyle = '#cceeff';
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    const tileWidth = 64;
    for (let x = -this.groundOffset; x < this.canvasWidth; x += tileWidth) {
      if (this.groundTileImg.complete && this.groundTileImg.naturalWidth > 0) {
        this.ctx.drawImage(this.groundTileImg, x, 270, tileWidth, 30);
      } else {
        this.ctx.fillStyle = '#44aa44';
        this.ctx.fillRect(x, 270, tileWidth - 2, 30);
      }
    }

    this.groundOffset = (this.groundOffset + this.groundSpeed) % tileWidth;
  }

  private spawnObstaclesLogic() {
    if (this.gameOver) return;

    this.obstacleTimer--;
    if (this.obstacleTimer <= 0) {
      const obs = Bodies.rectangle(800, 250, 20, 40, {
        label: 'obstacle',
        isStatic: true, // ← diventano statici per gestirli noi
      });

      this.obstacles.push(obs);
      Composite.add(this.engine.world, obs);
      this.obstacleTimer = 80 + Math.floor(Math.random() * 60);
    }

    this.obstacles = this.obstacles.filter((o) => o.position.x > -50);
  }

  private moveObstacles() {
    const speed = -5;

    this.obstacles.forEach((obs) => {
      Body.translate(obs, { x: speed, y: 0 });
    });
  }

  private drawEntities() {
    // Player
    if (this.dinoImg.complete && this.dinoImg.naturalWidth > 0) {
      this.ctx.drawImage(
        this.dinoImg,
        this.player.position.x - 20,
        this.player.position.y - 20,
        40,
        40
      );
    } else {
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(
        this.player.position.x - 15,
        this.player.position.y - 15,
        30,
        30
      );
    }

    // Cactus
    this.obstacles.forEach((obs) => {
      if (this.cactusImg.complete && this.cactusImg.naturalWidth > 0) {
        this.ctx.drawImage(
          this.cactusImg,
          obs.position.x - 10,
          obs.position.y - 25,
          30,
          50
        );
      } else {
        this.ctx.fillStyle = '#a00';
        this.ctx.fillRect(obs.position.x - 10, obs.position.y - 25, 20, 40);
      }
    });
  }

  private drawScore() {
    this.ctx.font = '20px monospace';
    this.ctx.fillStyle = '#222';
    this.ctx.fillText(`Score: ${this.score}`, this.canvasWidth - 130, 30);
  }

  @HostListener('window:keydown', ['$event'])
  handleInput(event: KeyboardEvent) {
    if (event.code === 'Space' && !this.gameOver) {
      const canJump = Math.abs(this.player.velocity.y) < 1;
      if (canJump) {
        Body.setVelocity(this.player, { x: 0, y: -10 });
      }
    }

    if (event.code === 'Enter' && this.gameOver) {
      location.reload();
    }
  }
}

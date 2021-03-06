var config = {
    type: Phaser.AUTO,
    width: 600,
    height: 600,
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    title: 'chickaHalf',
    pixelArt: false,
    backgroundColor: '555555'
};

// create game
var game = new Phaser.Game(config);

function preload() {

    // loader
    let pre = this.add.text(395, 10, "").setDepth(10).setFont('18px Arial').setAlign('center').setColor('#FFFFFF');
    this.load.on('progress', function (value) {
        pre.setText(Math.round(value * 100) + "%");
    });

    // background photo
    this.load.image('jardin', 'assets/images/jardin.jpg');
    this.load.image('rebord', 'assets/images/rebord-c.png');

    // chick
    this.load.atlas('chickAtlas', 'assets/images/spritesheet.png', 'assets/images/sprites.json');
    this.load.image('ombre', 'assets/images/ombre.png');
    //console.log(this.textures.get('chickAtlas').frames);

    // cheese
    this.load.image('fromage', 'assets/images/fromage.png');

    // audio
    this.load.audio('song', 'assets/audio/Sunny Day-SoundBible-com-2064222612.mp3');

    // remove on load
    this.load.on('complete', function () {
        pre.destroy();
    });

}
/**
 * 
 * global vars
 * 
 */


// state control var
var etat = 0;

// random function
var rnd = function () { return Math.random() }

// tracking pause times
var inst = 0;
// how long to pause, which etat est le prochain
function pausNxt(t, e) {
    // var dedie du temps
    inst++;
    if (inst > t) {
        // bird lands
        etat = e;
        // reset
        inst = 0;
    }
}

// landing spots, x, y, starting direction
var rebordA = [
    { rx: 260, ry: 332.5, rs: 1 },
    { rx: 350, ry: 335, rs: -1 }
];
var rebInd = 0;

/**
 * Head movement data pairs
 * {atlas frame, multiples of insLen}
 * pref 'chick'
 * 0 - stand
 * 1, 2 - bend
 * 3 - peck
 * 4 - look away
 * 5 - look at
 * 6 - cheese in beak
 * 7 - face wing up
 * 8 - face wing down
 * 9 - back wing up
 * 10 - back wing up
 * 
 */

// gestes
var mvmt1A = [{ f: 0, t: 3 }, { f: 4, t: 1 }, { f: 5, t: 1 }, { f: 0, t: 3 }];
var mInd = 0;
var mLen = mvmt1A.length;
var mPause = 10;

// flying 
var flyInA = [7, 8];
var flyOutA = [9, 10];
var flyInd = 0;
// num of update loops before changing textures
var flyP = 3;

// cheeses
var chzA = [];
var nextChz;

// peck
var peckA = [0, 1, 2, 3, 2, 6];
var pLen = peckA.length;
var peckInd = 0;
var peckP = 2;

// hopping
var hopA = [];
var hopInd = 0;
var hopP = 40;
var hop = 180;
// trying a 2-part hop with less X on the first half
var h2 = false;
// slight pause to see lean forward
var duck = 0;
var duckP = 3;

var calcHops = function (deb, fin, hop) {

    // delta, including direction
    let dx = fin.x - deb.x;
    let dy = fin.y - deb.y;

    let ax = Math.abs(dx);
    let ay = Math.abs(dy);

    let far =  ax < ay ? ay : ax;
    let loop = Math.floor(far / hop);

    for (let i = 0; i <= loop; i++) {
        let mx = 0;
        let my = 0;
        let d;
        // move until 0
        d = Math.abs(dx);
        if (dx < 0) {
            mx = -1 * (d > hop ? hop : d);
        } else if (dx > 0) {
            mx = 1 * (d > hop ? hop : d);
        }
        d = Math.abs(dy);
        if (dy < 0) {
            my = -1 * (d > hop ? hop : d);
        } else if (dy > 0) {
            my = 1 * (d > hop ? hop : d);
        }
        // update d
        dx -= mx;
        dy -= my;
        // 
        let obj = { cx: mx, cy: my }
        hopA.push(obj);
    }
}

function create() {

    /**
    * Depths - jardin = 1
    *          rebord = 5
    *          cheese = 7
    *          chick = 3, 6
    */

    // background photo
    this.jardin = this.add.image(0, 0, 'jardin').setDepth(1).setOrigin(0, 0);
    this.rebord = this.add.image(0, 0, 'rebord').setDepth(5).setOrigin(0, 0).setInteractive();

    // audio - must be here in Scene create()
    this.song = this.sound.add('song', { loop: true });
    this.song.play();

    // instructions
    let text = "Appuyez sur le rebord pour nourrir l'oiseau";
    this.instr = this.add.text(125, 430, text).setDepth(10).setFont('18px Arial').setAlign('center').setColor('#000000');


    /**
     * 
     * chick - created, no seen; origin is bottom center, depth of 3
     * remade sprite P
     * 
     */
    this.chick = this.add.sprite(-50, -50, 'chickAtlas').setDepth(3).setOrigin(1, 1);

    // to control which face to use from atlas
    this.chick.skin = function (n) {
        this.setTexture('chickAtlas', 'chick' + n);
    }

    // flying in and out
    this.chick.fly = function (flyA) {
        if (inst < flyP) {
            // pause
            inst++;
        } else {
            // flap
            flyInd = flyInd > 0 ? 0 : 1;
            this.skin(flyA[flyInd]);
            inst = 0;
        }
    }

    this.chick.geste = function () {
        // if still movements left to do
        if (mInd < mLen) {

            // capture cur movement
            let move = mvmt1A[mInd];
            // set

            this.skin(move.f);
            //console.log(this.chick.frame.name);

            // check time of movement
            if (inst < move.t * mPause) {
                inst++;

            } else {
                // reset, move on
                mInd++;
                inst = 0;
            }
            // done w movements
        } else {
            // reset mvmt
            mInd = 0;
            // move on to eat
            etat++;
        }
    }

    // peck - pick up cheese
    this.chick.peck = function () {
        if (inst < peckP) {
            // wait
            inst++;
        } else {
            // progress through pecking array
            if (peckInd < pLen) {
                this.skin(peckA[peckInd]);
                // cheese disappears
                if (peckInd == 3) nextChz.x = -50;
                peckInd++;
            } else {
                // have cheese
                nextChz.eaten = true;
                // reset
                inst = 0;
                peckInd = 0;
                // next etat
                etat++;
            }

        }
    }
    // accepts private A of two skins while hopping
    this.chick.hop = function (skinA) {
        // uses global hopA filled by calc        
        if (inst < hopP) {
            // wait
            inst++;
        } else {
            // hopping
            if (hopInd < hopA.length) {
                // duck for a split sec
                this.skin(skinA[0]);
                if (duck<duckP){
                    duck++;
                    return;
                } else {
                    duck=0;
                }
                let t = hopA[hopInd];
                // look left or right (excludes t.cx == 0)
                if (t.cx > 0) {
                    this.scaleX = 1;
                } else if (t.cx < 0) {
                    this.scaleX = -1;
                }
                // 
                let xhalf;
                // separate first and 2nd parts of hop (note 70 / 30 does not work)
                if (!h2) {
                    xhalf = 0.75;
                    h2 = true;
                    // random pausing during hop
                    inst = hopP / Math.round(5*rnd());
                } else {
                    xhalf = 0.25;
                    h2 = false;
                    // ready to end hop
                    inst = 0;
                    // prep for next hop
                    hopInd++;
                }
                // hop a little
                this.x += t.cx * xhalf;
                this.y += t.cy * 0.5;
                // sur le rebord (greatest y is 670)
                this.setDepth(this.y < 336 ? 3 : 6);
                // stand back up
                this.skin(skinA[1]);
                if (duck<duckP){
                    duck++;
                    return;
                } else {
                    duck=0;
                }
            } else {
                // done hopping
                hopA = [];
                hopInd = 0;
                // peck
                etat++;
            }
        }

    }

    /**
     *  cheese
     */

    // put a cheese down
    this.rebord.on('pointerdown', function (pointer, localX, localY) {

        // remove instructions
        this.instr.destroy();

        // sur le rebord
        if (pointer.y > 350) {
            let chz = this.add.image(pointer.x, pointer.y, 'fromage').setDepth(7);
            // eaten state
            chz.eaten = false;
            // add to array
            chzA.push(chz);
        }

    }, this);
}

// about 100 times per second
function update() {
    //console.log(etat);
    /**
     * game etat
     * 0 - waiting for cheese
     * 1 - waiting for chick ~ 2 secs
     * 2 - chick lands
     * 3 - gests
     * 4 - confirm available cheese, choose one, calc distance
     * 5 - calc moveX, Y for one hop
     * 6 - hop closer to cheese
     * 
     */

    // wait for cheese
    if (etat == 0) {
        // 
        if (chzA.length > 0) {
            // if not eaten, pick first available cheese
            chzA.forEach(chz => {
                if (!chz.eaten) {
                    // there is cheese
                    nextChz = chz;
                    etat = 1;
                }
            });
        }
    }

    // pause waiting for chick to fly in - about 2 secs
    if (etat == 1) {
        // 150 loops, to etat 2
        pausNxt(75, 2);
    }

    // bring in chick, rnd location sur le rebord - once
    if (etat == 2) {

        // add a chick in one of two spots
        rebInd = rnd() > 0.5 ? 1 : 0;

        // move x
        this.chick.x = rebordA[rebInd].rx

        // facing right or left landing sur rebord
        this.chick.scaleX = rebordA[rebInd].rs;

        // reset depth
        this.chick.setDepth(3);

        // shadow underneath (half the display width of bird)
        //this.om = this.add.sprite(this.chick.cx - (this.chick.displayWidth / 2), this.chick.cy, 'ombre').setDepth(2);
        //this.om.setScale(3);

        // ready to gest
        etat = 3;
    }

    /**
     * 
     * flying in
     * flyInA = [7, 8];
     * flyInd = 0;
     * 
     */
    if (etat == 3) {
        // 30px per cycle is arbitrary but looks good
        if (this.chick.y + 15 < rebordA[rebInd].ry) {
            // flapping
            this.chick.fly(flyInA);
            // smooth in
            this.chick.y += 15;
        } else {
            // stop flying
            this.chick.skin(0);
            etat = 4;
        }
    }

    // natural gestes, not pursing food
    if (etat == 4) {
        this.chick.geste();
    }
    // choose a cheese
    if (etat == 5) {
        // capture distance and direction to cheese
        calcHops(this.chick, nextChz, hop);
        etat = 6;
    }
    // hop to cheese
    if (etat == 6) {
        this.chick.hop([1,0]);
    }
    // peck
    if (etat == 7) {
        // advances to next etat at end
        this.chick.peck();
    }
    // look at viewer
    if (etat == 8) {
        // 150 loops, to etat 5
        pausNxt(35, 9);
    }
    // turn and go
    if (etat == 9) {
        this.chick.skin(4);
        //this.chick.setDepth(3);
        let ind = rnd() > 0.5 ? 1 : 0;
        let obj = {};
        obj.x = rebordA[ind].rx;
        obj.y = rebordA[ind].ry;
        // leaves more quickly than he came
        calcHops(this.chick, obj,hop*2);
        etat = 10;
    }
    if (etat == 10) {
        pausNxt(15, 11);
    }
    if (etat == 11){
        this.chick.hop([4,4]);
    }
    if (etat == 12) {
        if (this.chick.y > 0) {
            // flapping
            this.chick.fly(flyOutA);
            // smooth out
            this.chick.y -= 25;
        } else {
            // stop flying
            this.chick.skin(0);
            etat = 0;
        }
    }

}





var game = new Phaser.Game(1200, 800, Phaser.AUTO, 'TutContainer', { preload: preload, create: create, update:update });
var upKey;
var socket;
var downKey;
var leftKey;
var rightKey;
//level array
var levelData =
    [[43,50,50,50,50,50,50,50,50,50,45],
    [52,0,0,0,0,0,0,0,0,0,56],
    [52,0,0,0,0,0,0,0,0,0,56],
    [52,0,0,0,0,0,0,0,0,0,56],
    [52,0,0,0,0,0,0,0,0,0,56],
    [52,0,0,0,0,0,0,0,0,0,56],
    [52,0,0,0,0,0,0,0,0,0,56],
    [52,0,0,0,0,0,0,0,0,0,56],
    [52,0,0,0,0,0,0,0,0,0,56],
    [52,0,0,0,0,0,0,0,0,0,56],
    [47,54,54,54,54,54,54,54,54,54,41]];


//x & y values of the direction vector for character movement
var dX=0;
var dY=0;
//the enemy player list
var enemies = [];
var tileWidth=50;// the width of a tile
var borderOffset = new Phaser.Point(550,150);//to centralise the isometric level display
var wallGraphicHeight=138;
var floorGraphicWidth=103;
var floorGraphicHeight=50;
var heroGraphicWidth=41;
var heroGraphicHeight=62;
var wallHeight= (wallGraphicHeight - floorGraphicHeight);
var heroHeight= (floorGraphicHeight/2)+(heroGraphicHeight-floorGraphicHeight)+6;//adjustments to make the legs hit the middle of the tile for initial load
var heroWidth= (floorGraphicWidth/2)-(heroGraphicWidth/2);//for placing hero at the middle of the tile
var facing='south';//direction the character faces
var sorcerer;//hero
var sorcererShadow;//duh
var shadowOffset=new Phaser.Point(heroWidth+7,11);
var normText;//text to display hero coordinates
var minimap;//minimap holder group
var heroMapSprite;//hero marker sprite in the minimap
var gameScene;//this is the render texture onto which we draw depth sorted scene
var floorSprite;
var wallSprite;
var heroMapTile;//hero tile values in array
var heroMapPos;//2D coordinates of hero map marker sprite in minimap, assume this is mid point of graphic
var heroSpeed=1.8;//well, speed of our hero


function preload() {
    game.load.crossOrigin='Anonymous';
    game.stage.disableVisibilityChange = true;
    //load all necessary assets
    game.load.image('greenTile', 'https://dl.dropboxusercontent.com/s/nxs4ptbuhrgzptx/green_tile.png?dl=0');
    game.load.image('redTile', 'https://dl.dropboxusercontent.com/s/zhk68fq5z0c70db/red_tile.png?dl=0');
    game.load.image('heroTile', 'https://dl.dropboxusercontent.com/s/8b5zkz9nhhx3a2i/hero_tile.png?dl=0');
    game.load.image('heroShadow', 'https://dl.dropboxusercontent.com/s/sq6deec9ddm2635/ball_shadow.png?dl=0');
   //game.load.image('floor', 'https://dl.dropboxusercontent.com/s/h5n5usz8ejjlcxk/floor.png?dl=0');
    game.load.image('ball', 'https://dl.dropboxusercontent.com/s/pf574jtx7tlmkj6/ball.png?dl=0');
    game.load.atlasJSONArray('hero', 'https://dl.dropboxusercontent.com/s/hradzhl7mok1q25/hero_8_4_41_62.png?dl=0', 'https://dl.dropboxusercontent.com/s/95vb0e8zscc4k54/hero_8_4_41_62.json?dl=0');
    game.load.atlasJSONArray('floor', 'sprites/basic_ground_tile.png', 'sprites/basic_ground_tile.json');
}

function create() {

    socket = io(); // define a global variable called socket

    console.log("client started");
    socket.on("connect", onsocketConnected);

    //listen to new enemy connections
    socket.on("new_enemyPlayer", onNewPlayer);
    //listen to enemy movement
    socket.on("enemy_move", onEnemyMove);

    // when received remove_player, remove the player passed;
    socket.on('remove_player', onRemovePlayer);

    normText=game.add.text(10,660,"hi");
    upKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);
    downKey = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
    leftKey = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
    rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
    game.stage.backgroundColor = '#cccccc';
    //we draw the depth sorted scene into this render texture
    gameScene=game.add.renderTexture(game.width,game.height);
    game.add.sprite(0, 0, gameScene);
    floorSprite = game.make.sprite(0, 0, 'floor', 'sprite2');
    sorcererShadow = game.make.sprite(0,0,'heroShadow');
    sorcererShadow.scale= new Phaser.Point(0.5,0.6);
    sorcererShadow.alpha=0.4;
    createLevel();
}

function onsocketConnected () {
    console.log("connected to server" + this.id);

    addHero();

    socket.emit('new_player', {x: 0, y: 0});
}

function findplayerbyid (id) {
    for (var i = 0; i < enemies.length; i++) {
        if (enemies[i].id === id) {
            return enemies[i];
        }
    }
}

// this is the enemy class.
var remote_player = function (id, startx, starty) {

    heroMapTile = new Phaser.Point(startx,starty);
    // sprite
    sorcerer = game.add.sprite(-50, 0, 'hero', '1.png');// keep him out side screen area

    // animation
    sorcerer.animations.add('southeast', ['1.png','2.png','3.png','4.png'], 6, true);
    sorcerer.animations.add('south', ['5.png','6.png','7.png','8.png'], 6, true);
    sorcerer.animations.add('southwest', ['9.png','10.png','11.png','12.png'], 6, true);
    sorcerer.animations.add('west', ['13.png','14.png','15.png','16.png'], 6, true);
    sorcerer.animations.add('northwest', ['17.png','18.png','19.png','20.png'], 6, true);
    sorcerer.animations.add('north', ['21.png','22.png','23.png','24.png'], 6, true);
    sorcerer.animations.add('northeast', ['25.png','26.png','27.png','28.png'], 6, true);
    sorcerer.animations.add('east', ['29.png','30.png','31.png','32.png'], 6, true);
}

//Server will tell us when a new enemy player connects to the server.
//We create a new enemy in our game.
function onNewPlayer (data) {
    console.log(data);
    //enemy object
    var new_enemy = new remote_player(data.id, data.x, data.y);
    enemies.push(new_enemy);
}

//Server tells us there is a new enemy movement. We find the moved enemy
//and sync the enemy movement with the server
function onEnemyMove (data) {
    console.log(data);
    var movePlayer = findplayerbyid(data.id);

    if (!movePlayer) {
        return;
    }
    movePlayer.x = data.x;
    movePlayer.y = data.y;
}


// When the server notifies us of client disconnection, we find the disconnected
// enemy and remove from our game
function onRemovePlayer (data) {
    var removePlayer = findplayerbyid(data.id);
    // Player not found
    if (!removePlayer) {
        console.log('Player not found: ', data.id)
        return;
    }

     removePlayer.player.destroy();
}

function update(){

    //check key press
    detectKeyInput();

    //if no key is pressed then stop else play walking animation
    if (dY === 0 && dX === 0)
    {
        sorcerer.animations.stop();
        sorcerer.animations.currentAnim.frame=0;
    } else {
        if(sorcerer.animations.currentAnim !== facing){
            sorcerer.animations.play(facing);
        }
    }
    //check if we are walking into a wall else move hero in 2D
    if (isWalkable())
    {
        heroMapPos.x +=  heroSpeed * dX;
        heroMapPos.y +=  heroSpeed * dY;
        heroMapSprite.x=heroMapPos.x-heroMapSprite.width/2;
        heroMapSprite.y=heroMapPos.y-heroMapSprite.height/2;
        //get the new hero map tile
        heroMapTile = getTileCoordinates(heroMapPos,tileWidth, false);
        //depthsort & draw new scene
        renderScene();

        var tmp = getTileCoordinates(heroMapPos,tileWidth, true);

        socket.emit('move_player', {x: tmp.x, y: tmp.y});
    }
}

function createLevel(){//create minimap
    minimap= game.add.group();
    var tileType = 0;
    for (var i = 0; i < levelData.length; i++)
    {
        for (var j = 0; j < levelData[0].length; j++)
        {
            tileType=levelData[i][j];
            placeTile(tileType,i,j);
        }
    }
    addHero();
    heroMapSprite=minimap.create(heroMapTile.y * tileWidth, heroMapTile.x * tileWidth, 'heroTile');
    heroMapSprite.x+=(tileWidth/2)-(heroMapSprite.width/2);
    heroMapSprite.y+=(tileWidth/2)-(heroMapSprite.height/2);
    heroMapPos=new Phaser.Point(heroMapSprite.x+heroMapSprite.width/2,heroMapSprite.y+heroMapSprite.height/2);
    heroMapTile=getTileCoordinates(heroMapPos,tileWidth, false);
    minimap.scale= new Phaser.Point(0.3,0.3);
    minimap.x=0;
    minimap.y=0;
    renderScene();//draw once the initial state
}
function addHero(){

    var y = game.rnd.integerInRange(1, levelData.length -2);

    var x = game.rnd.integerInRange(1, levelData[0].length -2);

    heroMapTile = new Phaser.Point(x,y);
    // sprite
    sorcerer = game.add.sprite(-50, 0, 'hero', '1.png');// keep him out side screen area

    // animation
    sorcerer.animations.add('southeast', ['1.png','2.png','3.png','4.png'], 6, true);
    sorcerer.animations.add('south', ['5.png','6.png','7.png','8.png'], 6, true);
    sorcerer.animations.add('southwest', ['9.png','10.png','11.png','12.png'], 6, true);
    sorcerer.animations.add('west', ['13.png','14.png','15.png','16.png'], 6, true);
    sorcerer.animations.add('northwest', ['17.png','18.png','19.png','20.png'], 6, true);
    sorcerer.animations.add('north', ['21.png','22.png','23.png','24.png'], 6, true);
    sorcerer.animations.add('northeast', ['25.png','26.png','27.png','28.png'], 6, true);
    sorcerer.animations.add('east', ['29.png','30.png','31.png','32.png'], 6, true);
}

function placeTile(tileType,i,j){//place minimap
    var tile = 'greenTile';
    if(tileType !== 0){
        tile='redTile';
    }
    minimap.create(j * tileWidth, i * tileWidth, tile);
}
function renderScene(){
    gameScene.clear();//clear the previous frame then draw again
    var tileType=0;
    for (var i = 0; i < levelData.length; i++)
    {
        for (var j = 0; j < levelData[0].length; j++)
        {
            tileType=levelData[i][j];
            drawTileIso(tileType,i,j);
            if(i===heroMapTile.y&&j===heroMapTile.x){
                drawHeroIso();
            }
        }
    }
    normText.text='Hero is on x,y: '+ heroMapTile.x +','+ heroMapTile.y;
}
function drawHeroIso(){
    var isoPt= new Phaser.Point();//It is not advisable to create points in update loop
    var heroCornerPt=new Phaser.Point(heroMapPos.x-heroMapSprite.width/2,heroMapPos.y-heroMapSprite.height/2);
    isoPt=cartesianToIsometric(heroCornerPt);//find new isometric position for hero from 2D map position
    gameScene.renderXY(sorcererShadow,isoPt.x+borderOffset.x+shadowOffset.x, isoPt.y+borderOffset.y+shadowOffset.y, false);//draw shadow to render texture
    gameScene.renderXY(sorcerer,isoPt.x+borderOffset.x+heroWidth, isoPt.y+borderOffset.y-heroHeight, false);//draw hero to render texture
}
function drawTileIso(tileType,i,j){//place isometric level tiles
    var isoPt= new Phaser.Point();//It is not advisable to create point in update loop
    var cartPt = new Phaser.Point();//This is here for better code readability.
    cartPt.x=j*tileWidth;
    cartPt.y=i*tileWidth;
    isoPt = cartesianToIsometric(cartPt);
    if(tileType !== 0){
        gameScene.renderXY(game.make.sprite(0, 0, 'floor', 'sprite' + tileType), isoPt.x+borderOffset.x, isoPt.y+borderOffset.y, false);
    }

    gameScene.renderXY(floorSprite, isoPt.x+borderOffset.x, isoPt.y+borderOffset.y, false);
}
function isWalkable(){//It is not advisable to create points in update loop, but for code readability.
    var able=true;
    var heroCornerPt=new Phaser.Point(heroMapPos.x-heroMapSprite.width/2,heroMapPos.y-heroMapSprite.height/2);
    var cornerTL =new Phaser.Point();
    cornerTL.x=heroCornerPt.x +  (heroSpeed * dX);
    cornerTL.y=heroCornerPt.y +  (heroSpeed * dY);
    // now we have the top left corner point. we need to find all 4 corners based on the map marker graphics width & height
    //ideally we should just provide the hero a volume instead of using the graphics' width & height
    var cornerTR =new Phaser.Point();
    cornerTR.x=cornerTL.x+heroMapSprite.width;
    cornerTR.y=cornerTL.y;
    var cornerBR =new Phaser.Point();
    cornerBR.x=cornerTR.x;
    cornerBR.y=cornerTL.y+heroMapSprite.height;
    var cornerBL =new Phaser.Point();
    cornerBL.x=cornerTL.x;
    cornerBL.y=cornerBR.y;
    var newTileCorner1;
    var newTileCorner2;
    var newTileCorner3=heroMapPos;
    //let us get which 2 corners to check based on current facing, may be 3
    switch (facing){
        case "north":
            newTileCorner1=cornerTL;
            newTileCorner2=cornerTR;
            break;
        case "south":
            newTileCorner1=cornerBL;
            newTileCorner2=cornerBR;
            break;
        case "east":
            newTileCorner1=cornerBR;
            newTileCorner2=cornerTR;
            break;
        case "west":
            newTileCorner1=cornerTL;
            newTileCorner2=cornerBL;
            break;
        case "northeast":
            newTileCorner1=cornerTR;
            newTileCorner2=cornerBR;
            newTileCorner3=cornerTL;
            break;
        case "southeast":
            newTileCorner1=cornerTR;
            newTileCorner2=cornerBR;
            newTileCorner3=cornerBL;
            break;
        case "northwest":
            newTileCorner1=cornerTR;
            newTileCorner2=cornerBL;
            newTileCorner3=cornerTL;
            break;
        case "southwest":
            newTileCorner1=cornerTL;
            newTileCorner2=cornerBR;
            newTileCorner3=cornerBL;
            break;
    }
    //check if those corners fall inside a wall after moving
    newTileCorner1=getTileCoordinates(newTileCorner1,tileWidth);
    if(levelData[newTileCorner1.y][newTileCorner1.x] !==0){
        able=false;
    }
    newTileCorner2=getTileCoordinates(newTileCorner2,tileWidth);
    if(levelData[newTileCorner2.y][newTileCorner2.x]!==0){
        able=false;
    }
    newTileCorner3=getTileCoordinates(newTileCorner3,tileWidth);
    if(levelData[newTileCorner3.y][newTileCorner3.x]!==0){
        able=false;
    }
    return able;
}

function detectKeyInput(){//assign direction for character & set x,y speed components
    if (upKey.isDown)
    {
        dY = -1;
    }
    else if (downKey.isDown)
    {
        dY = 1;
    }
    else
    {
        dY = 0;
    }
    if (rightKey.isDown)
    {
        dX = 1;
        if (dY === 0)
        {
            facing = "east";
        }
        else if (dY === 1)
        {
            facing = "southeast";
            dX = dY=0.5;
        }
        else
        {
            facing = "northeast";
            dX=0.5;
            dY=-0.5;
        }
    }
    else if (leftKey.isDown)
    {
        dX = -1;
        if (dY === 0)
        {
            facing = "west";
        }
        else if (dY === 1)
        {
            facing = "southwest";
            dY=0.5;
            dX=-0.5;
        }
        else
        {
            facing = "northwest";
            dX = dY=-0.5;
        }
    }
    else
    {
        dX = 0;
        if (dY == 0)
        {
            //facing="west";
        }
        else if (dY==1)
        {
            facing = "south";
        }
        else
        {
            facing = "north";
        }
    }
}

function cartesianToIsometric(cartPt){
    var tempPt=new Phaser.Point();
    tempPt.x=cartPt.x-cartPt.y;
    tempPt.y=(cartPt.x+cartPt.y)/2;
    return (tempPt);
}
function isometricToCartesian(isoPt){
    var tempPt=new Phaser.Point();
    tempPt.x=(2*isoPt.y+isoPt.x)/2;
    tempPt.y=(2*isoPt.y-isoPt.x)/2;
    return (tempPt);
}
function getTileCoordinates(cartPt, tileHeight, floor){

    var tempPt=new Phaser.Point();

    if(!floor) {
        tempPt.x=Math.floor(cartPt.x/tileHeight);
        tempPt.y=Math.floor(cartPt.y/tileHeight);
    } else {
        tempPt.x=(cartPt.x/tileHeight);
        tempPt.y=(cartPt.y/tileHeight);
    }
    return(tempPt);
}
function getCartesianFromTileCoordinates(tilePt, tileHeight){
    var tempPt=new Phaser.Point();
    tempPt.x=tilePt.x*tileHeight;
    tempPt.y=tilePt.y*tileHeight;
    return(tempPt);
}

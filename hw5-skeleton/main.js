


//this time we'll use three.js and optionally some physics library for a more hands-on experience with developing practical WebGL applications.
//
//*********************
//Canvas and cameras
//*********************

let canvas=document.getElementById("gl-canvas");
let context = canvas.getContext( 'webgl2', { alpha: false } );
let scene= new THREE.Scene();
scene.background = new THREE.Color(0xaac0dd);
scene.fog = new THREE.Fog(0xcce0ff,50,2000);

let width=canvas.clientWidth,height=canvas.clientHeight;
let origin=new THREE.Vector3();




//We will use multiple cameras in the demo, so put them in a map for simplicity.
let cameras={
	perspective:new THREE.PerspectiveCamera(75,width/height,0.1,10000),
	orthographic:new THREE.OrthographicCamera(width/-2,width/2,height/2,height/-2,1,10000),
	//todo:add array of cameras
};
cameras.perspective.position.z = 200;
cameras.orthographic.position.z = 200;
let camera=cameras.orthographic;

//extra credit todo: add option for multiple views on the same canvas. We want the front/top/side view of the scene, and have a fourth user-controllable view. You can use ArrayCamera - see https://threejs.org/examples/webgl_camera_array.html (look at the code to see how to set up subcameras and resize their viewports; they will not work unless the viewports are set)
//hint: using ArrayCamera can be tricky. You will need to set the initial camera positions and viewports, handle resize for them (note that you need to consider the device pixel ratio if dpr!=1, and an array camera's "type" is actually "PerspectiveCamera"), set the up property of sub-cameras because the default is the +y direction which is not necessarily desirable, and if you want to use the old controls for a sub camera, you need to set the control's targetwhen you switch, and manually update the camera's projection matrix in animate(). Also switching to/from array cameras would require changing the viewport(you can use resizeCanvas()). Finally you may need to set object.frustumCulled=false on *all* visible objects to avoid a disappearing problem with array cameras.


let renderer = new THREE.WebGLRenderer({ canvas: canvas, context: context });
renderer.setSize(width,height,false);
let dpr=window.devicePixelRatio||1;//for high DPR displays
renderer.setPixelRatio(dpr);

function resizeCanvas(forceResize=false) {//Some demos only detect window resizing, but we can make the viewport and camera adjust to the canvas size whether it changed because of a window resize or something else like style changes. See https://webgl2fundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
//Note: to make the canvas always fill the window, the canvas and the html and body elements that contains it all have to have the styles width:100%;height:100%; see the html file.
	var w = canvas.clientWidth;
	var h = canvas.clientHeight;
	if(width!=w||height!=h||forceResize){
		console.log("changing size to "+w+", "+h);
		width=w;height=h;
		renderer.setSize(w,h,false);//false means do not set the size styles of the canvas. That'd defeat the purpose of automatically adjusting to the canvas's size.
		for(let cameraName in cameras){
			let camera=cameras[cameraName];
			switch(camera.type){
				case "PerspectiveCamera": camera.aspect = w/h; break;
				case "OrthographicCamera": camera.left=w/-2;camera.right=w/2;camera.top=h/2;camera.bottom=h/-2; break;
			}
			camera.updateProjectionMatrix();
		}
	}
}
resizeCanvas(true);

let controls = new THREE.OrbitControls( camera, canvas );
//note: you can change the target controlled object(camera)by setting control.target

//*********************
//Add lights and background
//*********************
//without lights, the materials whose appearence depend on light like MeshStandardMaterial in three.js would not look right
let ambientLight=new THREE.AmbientLight(0xaaaaaa);
scene.add(ambientLight);
let hemisphereLight=new THREE.HemisphereLight(0x303F9F,0x000000,0.5);
scene.add(hemisphereLight);
let directionalLight = new THREE.DirectionalLight( 0xdfebff, 1);
directionalLight.position.set( 20, 20, 100 );
scene.add(directionalLight);

let groundGeometry = new THREE.PlaneBufferGeometry(200,400);
let groundMaterial = new THREE.MeshLambertMaterial({color:0x000000});
let ground = new THREE.Mesh( groundGeometry, groundMaterial );
groundMaterial.side=THREE.DoubleSide;

//add 10x20 grid consisting of horizontal and vertical lines on top of ground to help visualize tetris placements
let lineGeometry = new THREE.BufferGeometry();
let lineMaterial = new THREE.LineBasicMaterial( { color: 0x808080 } );
let vertlinePositions = new Float32Array( 10 * 3 * 2 );//20 lines, each line has 2 points, each point has 3 coordinates
for ( let i = 0; i < 10; i ++ ) {
	vertlinePositions[ i * 6 ] = -100 + i * 20; // x
	vertlinePositions[ i * 6 + 1 ] = -200; // y
	vertlinePositions[ i * 6 + 2 ] = 0; // z

	vertlinePositions[ i * 6 + 3 ] = -100 + i * 20; // x
	vertlinePositions[ i * 6 + 4 ] = 200; // y
	vertlinePositions[ i * 6 + 5 ] = 0; // z
}
lineGeometry.setAttribute( 'position', new THREE.BufferAttribute( vertlinePositions, 3 ) );
let vertline = new THREE.LineSegments( lineGeometry, lineMaterial );
vertline.position.y = 0.1;
scene.add( vertline );

let horilinePositions = new Float32Array( 20 * 3 * 2 );//20 lines, each line has 2 points, each point has 3 coordinates
for ( let i = 0; i < 20; i ++ ) {
	horilinePositions[ i * 6 ] = -100; // x
	horilinePositions[ i * 6 + 1 ] = -200 + i * 20; // y
	horilinePositions[ i * 6 + 2 ] = 0; // z

	horilinePositions[ i * 6 + 3 ] = 100; // x
	horilinePositions[ i * 6 + 4 ] = -200 + i * 20; // y
	horilinePositions[ i * 6 + 5 ] = 0; // z
}
lineGeometry = new THREE.BufferGeometry();
lineGeometry.setAttribute( 'position', new THREE.BufferAttribute( horilinePositions, 3 ) );
let horiline = new THREE.LineSegments( lineGeometry, lineMaterial );
horiline.position.y = 0.1;
scene.add( horiline );

ground.position.set( 0, 0, -1 );
scene.add( ground );




//*********************
//Add blocks
//*********************
//The body will be children of the base in the scene graph, so that rotation of the box applies automatically to the body. For more info on scene graphs see https://threejsfundamentals.org/threejs/lessons/threejs-scenegraph.html

//this example shows how to programmatically create simple shapes. More complex models should probably be designed in external software and imported.
//note that we can reuse geometries and materials, and only change the position and rotation of the object(mesh) to create multiple copies of something.


//extra credit todo: textures
//let's add some materials with textures! For more info see https://threejsfundamentals.org/threejs/lessons/threejs-textures.html
//like in HW2, we can load a texture image using a data URL to avoid the need to set up a server for the webpage. See https://webgl2fundamentals.org/webgl/lessons/webgl-cors-permission.html about why, and https://onlinepngtools.com/convert-png-to-base64 for a tool to convert a picture to base64 encoding. The skeleton HTML file already includes a few encoded images but you can add your own. You don't have to use base64 encoding, and can also load an image normally from a server. Some public websites are configured to allow their images to be used in WebGL, and you can easily set up your local web server, for example by using Python: "python3 -m http.server" or "python -m SimpleHTTPServer" - see https://developer.mozilla.org/en-US/docs/Learn/Common_questions/set_up_a_local_testing_server
let loader=new THREE.TextureLoader();

//Here's an example of using an image texture. See https://threejs.org/docs/#api/en/textures/Texture 
/*
let paintTexture=new THREE.TextureLoader().load(document.getElementById("paint-texture-image").src);
let cannonMaterial=new THREE.MeshStandardMaterial( {color: 0xffffaa, metalness:0.8,roughness:0.6,roughnessMap:paintTexture});//trying to get a rough metal effect
*/


//Tetris I block
let IblockMaterial = new THREE.MeshStandardMaterial({ color: 0x00FFFF});
IblockMaterial.side = THREE.DoubleSide;
let IblockGeometry = new THREE.BoxBufferGeometry(80, 20, 20);
let Iblock1 = new THREE.Mesh(IblockGeometry, IblockMaterial);
Iblock1.position.set(150, 190, 10);

// Add lines to make the I block appear as 4 even cubes (Update to add lines to all sides of the I block)
let BlockLineMaterial = new THREE.LineBasicMaterial({ color: 0x808080 });
let IblockLineGeometry = new THREE.BufferGeometry();
let IblockLinePositions = new Float32Array(4 * 3 * 2);

for (let i = 0; i < 4; i++) {
	let x = -40 + i * 20; // Divide the I block into 4 segments
	IblockLinePositions[i * 6] = x; // Start x
	IblockLinePositions[i * 6 + 1] = -10; // Start y
	IblockLinePositions[i * 6 + 2] = 10; // Start z

	IblockLinePositions[i * 6 + 3] = x; // End x
	IblockLinePositions[i * 6 + 4] = 10; // End y
	IblockLinePositions[i * 6 + 5] = 10; // End z
}

IblockLineGeometry.setAttribute('position', new THREE.BufferAttribute(IblockLinePositions, 3));
let IblockLines = new THREE.LineSegments(IblockLineGeometry, BlockLineMaterial);
Iblock1.add(IblockLines); // Add the lines as a child of the I block
scene.add(Iblock1);

//Tetris J block
let JblockMaterial=new THREE.MeshStandardMaterial( {color: 0x0000FF});
JblockMaterial.side=THREE.DoubleSide;
let JblockGeometry=new THREE.BoxBufferGeometry( 60, 20, 20 );
let Jblock1=new THREE.Mesh( JblockGeometry, JblockMaterial );
Jblock1.position.set(140, 130, 10);

let JblockJointGeometry=new THREE.BoxBufferGeometry( 20, 20, 20 );
let JblockJoint1=new THREE.Mesh( JblockJointGeometry, JblockMaterial );
JblockJoint1.position.set(-20, 20, 0);
Jblock1.add(JblockJoint1); // Add the joint as a child of the J block

let JblockLineGeometry=new THREE.BufferGeometry();
let JblockLinePositions=new Float32Array( 4 * 3 * 2 );

//Lines for J block: 3 vertical lines and 1 horizontal line (Not implemented yet)


JblockLineGeometry.setAttribute( 'position', new THREE.BufferAttribute( JblockLinePositions, 3 ) );
let JblockLines=new THREE.LineSegments( JblockLineGeometry, BlockLineMaterial );
Jblock1.add(JblockLines); // Add the lines as a child of the J block
scene.add(Jblock1);

//Tetris L block
let LblockMaterial=new THREE.MeshStandardMaterial( {color: 0xFFA500});
LblockMaterial.side=THREE.DoubleSide;
let LblockGeometry=new THREE.BoxBufferGeometry( 60, 20, 20 );
let Lblock1=new THREE.Mesh( LblockGeometry, LblockMaterial );
Lblock1.position.set(140, 70, 10);

let LblockJointGeometry=new THREE.BoxBufferGeometry( 20, 20, 20 );
let LblockJoint1=new THREE.Mesh( LblockJointGeometry, LblockMaterial );
LblockJoint1.position.set(20, 20, 0);
Lblock1.add(LblockJoint1); // Add the joint as a child of the J block

let LblockLineGeometry=new THREE.BufferGeometry();
let LblockLinePositions=new Float32Array( 4 * 3 * 2 );
//Lines for L block: 3 vertical lines and 1 horizontal line (Not implemented yet)

LblockLineGeometry.setAttribute( 'position', new THREE.BufferAttribute( LblockLinePositions, 3 ) );
let LblockLines=new THREE.LineSegments( LblockLineGeometry, BlockLineMaterial );
Lblock1.add(LblockLines); // Add the lines as a child of the J block
scene.add(Lblock1);

//Tetris O block
let OblockMaterial=new THREE.MeshStandardMaterial( {color: 0xFFFF00});
OblockMaterial.side=THREE.DoubleSide;
let OblockGeometry=new THREE.BoxBufferGeometry( 40, 40, 20 );
let Oblock1=new THREE.Mesh( OblockGeometry, OblockMaterial );
Oblock1.position.set(130, 10, 10);

let OblockLineGeometry=new THREE.BufferGeometry();
let OblockLinePositions=new Float32Array( 4 * 3 * 2 );
// Add lines to make the O block appear as 4 even cubes (Not implemented yet)

OblockLineGeometry.setAttribute( 'position', new THREE.BufferAttribute( OblockLinePositions, 3 ) );
let OblockLines=new THREE.LineSegments( OblockLineGeometry, BlockLineMaterial );
Oblock1.add(OblockLines); // Add the lines as a child of the O block
scene.add(Oblock1);

//Tetris S block
let SblockMaterial=new THREE.MeshStandardMaterial( {color: 0x00FF00});
SblockMaterial.side=THREE.DoubleSide;
let SblockGeometry=new THREE.BoxBufferGeometry( 40, 20, 20 );
let Sblock1=new THREE.Mesh( SblockGeometry, SblockMaterial );
Sblock1.position.set(150, -50, 10);

let SblockJointGeometry=new THREE.BoxBufferGeometry( 40, 20, 20 );
let SblockJoint1=new THREE.Mesh( SblockJointGeometry, SblockMaterial );
SblockJoint1.position.set(-20, -20, 0);
Sblock1.add(SblockJoint1); // Add the joint as a child of the S block

let SblockLineGeometry=new THREE.BufferGeometry();
let SblockLinePositions=new Float32Array( 4 * 3 * 2 );
//Lines for S block: 3 vertical lines and 1 horizontal line (Not implemented yet)

SblockLineGeometry.setAttribute( 'position', new THREE.BufferAttribute( SblockLinePositions, 3 ) );
let SblockLines=new THREE.LineSegments( SblockLineGeometry, BlockLineMaterial );
Sblock1.add(SblockLines); // Add the lines as a child of the S block
scene.add(Sblock1);

//Tetris T block
let TblockMaterial=new THREE.MeshStandardMaterial( {color: 0x800080});
TblockMaterial.side=THREE.DoubleSide;
let TblockGeometry=new THREE.BoxBufferGeometry( 60, 20, 20 );
let Tblock1=new THREE.Mesh( TblockGeometry, TblockMaterial );
Tblock1.position.set(140, -130, 10);

let TblockJointGeometry=new THREE.BoxBufferGeometry( 20, 20, 20 );
let TblockJoint1=new THREE.Mesh( TblockJointGeometry, TblockMaterial );
TblockJoint1.position.set(0, 20, 0);
Tblock1.add(TblockJoint1); // Add the joint as a child of the T block

let TblockLineGeometry=new THREE.BufferGeometry();
let TblockLinePositions=new Float32Array( 4 * 3 * 2 );
//Lines for T block: 3 vertical lines and 1 horizontal line (Not implemented yet)

TblockLineGeometry.setAttribute( 'position', new THREE.BufferAttribute( TblockLinePositions, 3 ) );
let TblockLines=new THREE.LineSegments( TblockLineGeometry, BlockLineMaterial );
Tblock1.add(TblockLines); // Add the lines as a child of the T block
scene.add(Tblock1);

//Tetris Z block
let ZblockMaterial=new THREE.MeshStandardMaterial( {color: 0xFF0000});
ZblockMaterial.side=THREE.DoubleSide;
let ZblockGeometry=new THREE.BoxBufferGeometry( 40, 20, 20 );
let Zblock1=new THREE.Mesh( ZblockGeometry, ZblockMaterial );
Zblock1.position.set(130, -170, 10);

let ZblockJointGeometry=new THREE.BoxBufferGeometry( 40, 20, 20 );
let ZblockJoint1=new THREE.Mesh( ZblockJointGeometry, ZblockMaterial );
ZblockJoint1.position.set(20, -20, 0);
Zblock1.add(ZblockJoint1); // Add the joint as a child of the Z block

let ZblockLineGeometry=new THREE.BufferGeometry();
let ZblockLinePositions=new Float32Array( 4 * 3 * 2 );
//Lines for Z block: 3 vertical lines and 1 horizontal line (Not implemented yet)

ZblockLineGeometry.setAttribute( 'position', new THREE.BufferAttribute( ZblockLinePositions, 3 ) );
let ZblockLines=new THREE.LineSegments( ZblockLineGeometry, BlockLineMaterial );
Zblock1.add(ZblockLines); // Add the lines as a child of the Z block
scene.add(Zblock1);
//*********************



function rotateCannonsVertically(angle){//keeping them symmetrical. For a convenient UI it takes angles in degrees as input. Note that the axis is relative to the cannon base's frame and not the world's frame, since the body is a child object of the base, so the axis to rotate is actually its x axis.
	//todo: to rotate cannon bodies, we need to set the rotation or quaternion of the cannon bodies. Note: the body's rotation is based on its parent(the base)'s frame, so the rotation needed to keep them symmetric is actually the same, not opposite.
	//cannon1.body.quaternion.setFromAxisAngle(...);cannon2...
	//or
	//cannon1.body.rotation.x=...;cannon2...
}
function rotateCannonsHorizontally(angle){//keeping them symmetrical. An angle of zero makes both cannons face the front, so we would add 90 degrees
	//cannon1.quaternion.setFromAxisAngle(...);cannon2...
	//or
	//cannon1.rotation.z=...
}

rotateCannonsVertically(30);//starting state


//extra credit todo: add shadows for cannons and all other objects
//You need to renderer.shadowMap.enabled = true; to enable shadows, and add a light that supports casting shadows in the scene , such as THREE.DirectionalLight (for a large scene you will need to set the frustrum of the shadow camera to be bigger - see https://threejs.org/docs/#api/en/lights/shadows/DirectionalLightShadow), and set castShadow=true on objects that you want to cast shadows from, and set receiveShadow=true on objects you want to receive shadows such as the ground, and the receiving object must have a suppirting material such as THREE.MeshStandardMaterial or THREE.MeshLambertMaterial.

//*********************
//Firing cannons
//*********************
//we can create as many spheres as needed, but to save resources we can reuse spheres that need to be removed. Also, to do physics, we need to have a list of the spheres in the scene. Here's some code to manage and reuse spheres.
let cannonballRadius=4;
let cannonballStartingSpeed=50;
let sphereList=[],recycledSphereList=[];
let sphereGeometry=new THREE.SphereBufferGeometry( cannonballRadius, 32, 32 );
let sphereMaterial = new THREE.MeshStandardMaterial( {color: 0xeeeeee,metalness:1} );
let sphereMaterial2 = new THREE.MeshStandardMaterial( {color: 0xffff00,metalness:1} );

function fireCannon(cannon,material=sphereMaterial){
	let sphere;
	if(recycledSphereList.length>0){sphere=recycledSphereList.pop();}
	else{
		sphere=new THREE.Mesh(sphereGeometry, material);
	}
	sphereList.push(sphere);
	//to get the cannonball's starting position, we can get the local position relative to the body's frame, and transform it into world frame.
	let startPosition=cannon.body.localToWorld(new THREE.Vector3(0,cannonballStartingLength,0));//localToWorld gets the world coordinates of the starting point in local coordinates. If the input is a Vector3, it assumes it's a point. If the input is Vector4, it treats it as a point or vector according to the fourth dimension.
	sphere.position.copy(startPosition);
	let startingVelocity=cannon.body.localToWorld(new THREE.Vector4(0,cannonballStartingLength,0,0));//now we want a vector, not a point.
	sphere.velocity=new THREE.Vector3();sphere.velocity.copy(startingVelocity).normalize().multiplyScalar(cannonballStartingSpeed);//copy xyz only
	//this is also a custom property added to the mesh object for convenience. In more complex applications it's best to avoid the confusion that can be caused by adding random properties to library-defined objects.
	scene.add(sphere);
	
}
function fireCannons(){//make them fire different colored cannonballs together
	fireCannon(cannon1);
	fireCannon(cannon2,sphereMaterial2);
}


//*********************
//Do physics
//*********************
//note: this is a simplified example of rigid-body physics code. Here we only consider linear velocity, not angular velocity or rotation, and only support spheres of the same size. You can use a physics library for better effects, or look up rigid body physics simulation for more information.
let G=10;
function physicsTick(dt){//Usually we should separate animation frames and physics ticks, so that we can pause physics, or adjust the time step size of physics, to keep physics running smoothly in real time, because the time between animation frames may not be constant.
	for(let i=0;i<sphereList.length;i++){
		let sphere=sphereList[i];
		//todo: physics!
		//todo 1. integrate velocity and gravity acceleration. in our case, velocity.z -= G*dt, position += velocity*dt 
		//sphere.velocity.z...
		//sphere.position.addScaledVector(...);
		//note: since the sphere is directly a child of the scene, both position and velocity are in world frame, and we don't need to worry about transforming between frames here.
		
		//todo 2. detect if any two spheres collide
		for(let j=0;j<i;j++){
			let sphere2=sphereList[j];
			if(sphere2.position.distanceTo(sphere.position)<=cannonballRadius*2){
				//1) simple case: if the cannons always fire symmetrically, cannonballs always collide symmetrically along the YZ plane, so we can just flip the x velocity value. 
				//sphere.velocity.x=...
				//sphere2.velocity.x=...
				
				//2) extra credit todo: more complex case - if they are not necessarily symmetrical, we need to calculate the contact normal vector (from one ball's center to the other's center), and flip the velocity components in this normal direction, assuming balls always have the same mass. See https://en.wikipedia.org/wiki/Elastic_collision 
				
				//here's one way to do this:
				//let normal=new THREE.Vector3();normal.copy(sphere2.position).addScaledVector(sphere.position,-1);normal.normalize();
				//let projected=new THREE.Vector3();
				//projected.copy(sphere.velocity).projectOnVector(normal);
				//(now you get the projected velocity component in the normal vector's direction. You can use it to effectively flip the component in this direction)
				//sphere.velocity.addScaledVector(...);
				//(and same for sphere2)
				
				//extra credit todo: add support for different mass and/or inelastic collision	
				
			}
		}
	}
	//remove and recycle spheres that hit the ground (separated from the previous logic to avoid interference with spheres that are about to be removed)
	let tempSphereList=[];
	for(let sphere of sphereList){
		if(sphere.position.z<=0){
			scene.remove(sphere);recycledSphereList.push(sphere);
			//extra credit todo: add explosion effects when cannonballs hit the ground
			//You can do it from scratch or use a library to create particle effects.
			//add code to add particle emitters when the balls hit the ground and remove them after a time delay.
			//addExplosion(sphere.position);
		}
		else{tempSphereList.push(sphere);}
	}
	sphereList=tempSphereList;
}



//*********************
//Animate
//*********************
var oldTime=0;
//also add a FPS display to see the performance: see https://github.com/mrdoob/stats.js
let stats = new Stats();
stats.showPanel(0);// 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

function animate(t){
	stats.begin();
	resizeCanvas();
	if(camera.cameras){//ArrayCamera doesn't seem to update its sub cameras automatically
		controls.object.updateMatrixWorld();
		controls.object.updateProjectionMatrix();
	}
	physicsTick((t-oldTime)/1000);
	oldTime=t;
	renderer.render(scene,camera);
	stats.end();
	requestAnimationFrame(animate);
}
animate();


//*********************
// Add UI
//*********************
//There are many JavaScript UI libraries for different needs. Many three.js demos use dat.gui to create UI controls more easily and declaratively. See http://workshop.chromeexperiments.com/examples/gui for a tutorial on dat.gui.
let gui=new dat.GUI();
let controlsFolder=gui.addFolder("Controls");
let cannonInfo={
	distance:300,
	horizontalAngle:0,
	verticalAngle:30,
	startingSpeed:50,
	left:()=>{fireCannon(cannon1);},
	right:()=>{fireCannon(cannon2);}
};
controlsFolder.add(cannonInfo,"left");
controlsFolder.add(cannonInfo,"right");

let sceneFolder=gui.addFolder("Scene");
let sceneInfo={camera:"perspective"};
sceneFolder.add(sceneInfo,"camera",["perspective","orthographic"]).onChange((value)=>{ ///extra credit todo: add an option for array of cameras (details described above)
	camera=cameras[value];controls.object=camera;
});



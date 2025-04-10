


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

let groundGeometry = new THREE.PlaneBufferGeometry(400,800);
let groundMaterial = new THREE.MeshLambertMaterial({color:0x000000});
let ground = new THREE.Mesh( groundGeometry, groundMaterial );

//add 10x20 grid consisting of horizontal and vertical lines on top of ground to help visualize tetris placements
let lineGeometry = new THREE.BufferGeometry();
let lineMaterial = new THREE.LineBasicMaterial( { color: 0x808080 } );
let vertlinePositions = new Float32Array( 10 * 3 * 2 );//20 lines, each line has 2 points, each point has 3 coordinates
for ( let i = 0; i < 10; i ++ ) {
	vertlinePositions[ i * 6 ] = -200 + i * 40; // x
	vertlinePositions[ i * 6 + 1 ] = -400; // y
	vertlinePositions[ i * 6 + 2 ] = 0; // z

	vertlinePositions[ i * 6 + 3 ] = -200 + i * 40; // x
	vertlinePositions[ i * 6 + 4 ] = 400; // y
	vertlinePositions[ i * 6 + 5 ] = 0; // z
}
lineGeometry.setAttribute( 'position', new THREE.BufferAttribute( vertlinePositions, 3 ) );
let vertline = new THREE.LineSegments( lineGeometry, lineMaterial );
vertline.position.y = 0.1;
scene.add( vertline );

let horilinePositions = new Float32Array( 20 * 3 * 2 );//20 lines, each line has 2 points, each point has 3 coordinates
for ( let i = 0; i < 20; i ++ ) {
	horilinePositions[ i * 6 ] = -200; // x
	horilinePositions[ i * 6 + 1 ] = -400 + i * 40; // y
	horilinePositions[ i * 6 + 2 ] = 0; // z

	horilinePositions[ i * 6 + 3 ] = 200; // x
	horilinePositions[ i * 6 + 4 ] = -400 + i * 40; // y
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
//Add cannons
//*********************
//each cannon will have a base (a box) that can rotate horizontally, and a body (a truncated cone that has a sphere in one end) that can tilt up or down. The body will be children of the base in the scene graph, so that rotation of the box applies automatically to the body. For more info on scene graphs see https://threejsfundamentals.org/threejs/lessons/threejs-scenegraph.html

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


let cannonMaterial=new THREE.MeshStandardMaterial( {color: 0xffffaa, metalness:0.8,roughness:0.6});
cannonMaterial.side=THREE.DoubleSide;//to prevent some parts from disappearing when you look into the cannon's opening...

let cannonBaseMaterial=new THREE.MeshStandardMaterial( {color: 0xddddaa, metalness:0.1,roughness:0.9});
let cannonBaseGeometry=new THREE.BoxBufferGeometry( 20, 40, 10 );
let cannonSideGeometry=new THREE.BoxBufferGeometry( 4, 40, 15 );

//this simple cannon tube is a truncated cone that ends in a sphere, and can be defined by a lathed shape. See https://threejs.org/docs/#api/en/geometries/LatheBufferGeometry
//extra credit todo: load or even create your own better cannon model!
let cannonTubePoints = [];
let cannonEndRadius=5,cannonBodyOffset=15;//make the origin of the cannon body be in the middle, not at the end, so it rotates more realistically
let cannonMainLength=35,cannonRadiusDiff=2,cannonOpeningLength=5,cannonOpeningRadiusDiff=1;
let cannonballStartingLength=cannonEndRadius+cannonMainLength+cannonOpeningLength-cannonBodyOffset;//where in the body will the cannonball appear later
for ( let i=0;i<10;i++) {
	cannonTubePoints.push( new THREE.Vector2(cannonEndRadius*Math.sin((Math.PI/2)*i/10),cannonEndRadius*(1-Math.cos((Math.PI/2)*i/10))-cannonBodyOffset));
	//1/4 of a circle, makes half a sphere; the x value is the distance from the axis, and the y value is the horizontal position along the axis.
}
for (let i=0;i<10;i++) {//add points for the main part of the body
	cannonTubePoints.push( new THREE.Vector2(cannonEndRadius-cannonRadiusDiff*i/10, cannonMainLength/10*i+cannonEndRadius-cannonBodyOffset) );
}
for (let i=0;i<10;i++) {//add points for the opening part of the body
	cannonTubePoints.push( new THREE.Vector2(cannonEndRadius-cannonRadiusDiff+cannonOpeningRadiusDiff*i/10, cannonOpeningLength*i/10+cannonMainLength+cannonEndRadius-cannonBodyOffset) );
}
let cannonBodyGeometry=new THREE.LatheBufferGeometry( cannonTubePoints );


function addCannon(position,quaternion){//THREE.js uses quaternions to represent rotation. You can also set the rotation instead.
	let base=new THREE.Mesh(cannonBaseGeometry,cannonBaseMaterial);
	base.position.copy(position);
	base.quaternion.copy(quaternion);
	scene.add(base);
	let body = new THREE.Mesh( cannonBodyGeometry, cannonMaterial );
	body.position.set(0,-10,20);
	base.add(body);
	base.body=body;//keep a reference to the cannon's body so later we can manipulate it independently.
	//add side panels so the body is not obviously floating
	let side1=new THREE.Mesh( cannonSideGeometry, cannonBaseMaterial );
	side1.position.set(8,0,10);
	base.add(side1);
	let side2=new THREE.Mesh( cannonSideGeometry, cannonBaseMaterial );
	side2.position.set(-8,0,10);
	base.add(side2);
	return base;
}

let up=new THREE.Vector3(0,0,1);
let front=new THREE.Vector3(0,1,0);
let right=new THREE.Vector3(1,0,0);
let cannon1=addCannon(new THREE.Vector3(150,0,5),new THREE.Quaternion().setFromAxisAngle(up,Math.PI/2));
let cannon2=addCannon(new THREE.Vector3(-150,0,5),new THREE.Quaternion().setFromAxisAngle(up,-Math.PI/2));

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



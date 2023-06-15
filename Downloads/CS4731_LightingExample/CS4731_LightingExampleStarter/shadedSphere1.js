var canvas;
var gl;
var program;

let justChanged=true;
var numTimesToSubdivide = 0;
var numTimesToSubdivideCurve = 0;
var translateMat = translate(0,0,0);
var index = 0;
var pointsArray = [];
var normalsArray = [];
var flatShadingArray = [];
let j = 0;
let lastLocations = [];
var near = .1;
var far = 100;
let animate = false;
let nextX = 0;
let nextY = 0;
let nextZ = 0;

let linePoints;

let justChangedLine = true;

let lineControlPoints = [
    vec4(0,0,0,1.0),
    vec4(-2, 3, 0.0, 1.0),
    vec4(10, 3, 0.0, 1.0),
    vec4(16.5, -3, 0.0, 1.0),
    vec4(8, -9, 0.0, 1.0),
    vec4(14, -15, 0.0, 1.0),
    vec4(0, -15, 0.0, 1.0),
    vec4(-2, -8, 0.0, 1.0),
];

//side 1
var va = normalize(vec4(.5, .5, .5, 1));
var vb = normalize(vec4(-.5, -.5, .5, 1));
var vc = normalize(vec4(-.5, .5, .5, 1));
var vd = normalize(vec4(.5, -.5, .5, 1));
//side 2
var ve = normalize(vec4(.5, -.5, -.5, 1));
var vf = normalize(vec4(-.5, -.5, -.5, 1))
var vg = normalize(vec4(-.5, .5, -.5, 1));
var vh = normalize(vec4(.5, .5, -.5, 1));

var lightPosition = vec4(3.0, 1.0, 1.0, 0.0 );
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialShininess = 20.0;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var eye;
var at = vec3(7.0, -6.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

function triangle(a, b, c) {



    pointsArray.push(a);
    pointsArray.push(b);
    pointsArray.push(c);

    flatShadingArray.push(a);
    flatShadingArray.push(a);
    flatShadingArray.push(a);

    // normals are vectors

    normalsArray.push(a[0],a[1], a[2], 0.0);
    normalsArray.push(a[0],a[1], a[2], 0.0);
    normalsArray.push(a[0],a[1], a[2], 0.0);

    index += 3;

}

function onkeypress(event){
    if(event.key === "q" ||event.key === "Q"){
        if(numTimesToSubdivide !== 0) {
            numTimesToSubdivide-=1;
            justChanged=true;

        }
    }
    if(event.key==="e"||event.key === "E"){
        if(numTimesToSubdivide !== 5) {
            numTimesToSubdivide += 1;
            justChanged=true;
        }
    }
    if(event.key==="a"||event.key === "A"){
        animate = !animate;
    }
    if(event.key==="i"||event.key === "I"){
        if(numTimesToSubdivideCurve !== 8) {
            lastLocations[numTimesToSubdivideCurve]=j;
           // j=j+(4*numTimesToSubdivideCurve*lineControlPoints.length);
            justChangedLine=true;
            numTimesToSubdivideCurve += 1;
            nextX=0;
            nextY=0;
            nextZ=0;
        }
    }
    if(event.key==="j"||event.key === "J"){
        if(numTimesToSubdivideCurve !== 0) {
            justChangedLine=true;
            numTimesToSubdivideCurve -= 1;
            if(j!==0) {
                j=lastLocations[numTimesToSubdivideCurve];
            }

            nextX=0;
            nextY=0;
            nextZ=0;
        }
    }
    pointsArray = [];
    normalsArray = [];
    flatShadingArray = [];
    setup();
}



function divideTriangle(a, b, c, count) {
    if ( count > 0 ) {

        var ab = mix( a, b, 0.5);
        var ac = mix( a, c, 0.5);
        var bc = mix( b, c, 0.5);

        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);

        divideTriangle( a, ab, ac, count - 1 );
        divideTriangle( ab, b, bc, count - 1 );
        divideTriangle( bc, c, ac, count - 1 );
        divideTriangle( ab, bc, ac, count - 1 );
    }
    else {
        triangle( a, b, c );
    }
}


function square(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}
window.addEventListener('keypress',onkeypress,false);

window.onload =
    function init() {

        canvas = document.getElementById( "gl-canvas" );
        gl = WebGLUtils.setupWebGL( canvas,undefined);
        if ( !gl ) { alert( "WebGL isn't available" ); }

        gl.viewport( 0, 0, canvas.width, canvas.height );
        gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

        gl.enable(gl.DEPTH_TEST);

        setup();
    }
    var id;
function setup(){
    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    if(justChanged) {
        divideSquare();
    }

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);


    var vNormal = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vNormal);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    var vNormalPosition = gl.getAttribLocation( program, "vNormal");
    gl.vertexAttribPointer(vNormalPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormalPosition);

    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );

    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);
    var ambientProduct = mult(lightAmbient, materialAmbient);


    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    eye = vec3(7,-7, 40);

    modelViewMatrix = lookAt(eye, at , up);
    var fovy = 30;
    projectionMatrix = perspective(fovy,1,near,far);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );

    gl.uniform1f(gl.getUniformLocation(program,"a"),0.0);
    if(justChangedLine) {
        linePoints = chaikin(lineControlPoints, numTimesToSubdivideCurve);
        justChangedLine=false;
    }
    let currentLine=linePoints[j];
    translateMat = translate(currentLine[0],currentLine[1],currentLine[2]);
    let nextLine;
    if(j===linePoints.length-1)
        nextLine=linePoints[0];
    else
    nextLine=linePoints[j+1];
    if(animate){
        if(aboveOrBelow(nextLine,currentLine)) {
            ++j;
            if (j === linePoints.length) {
                j = 0;
            }
            nextX=0;
            nextY=0;
            nextZ=0;
            currentLine=linePoints[j];
            if(j===linePoints.length-1)
                nextLine=linePoints[0];
            else
                nextLine=linePoints[j+1];
        }
        distanceX = nextLine[0]-currentLine[0];
        distanceY = nextLine[1]-currentLine[1];

        nextX +=distanceX/100;
        nextY +=distanceY/100;
    }
    translateMat = translate(currentLine[0] + nextX,currentLine[1]+ nextY,currentLine[2]);
    var vBuff = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuff);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(linePoints), gl.STATIC_DRAW);

    var vPos = gl.getAttribLocation( program, "vPos");
    gl.vertexAttribPointer(vPos, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPos);

    gl.drawArrays( gl.LINE_LOOP, 0, linePoints.length);

    gl.uniform1f(gl.getUniformLocation(program,"a"),1.0);
    var ctMatrixLoc = gl.getUniformLocation(program, "translate");
    gl.uniformMatrix4fv(ctMatrixLoc, false, flatten(translateMat));
    for( var i=0; i<index; i+=3) {
        gl.drawArrays(gl.TRIANGLES, i, 3);
    }
    if(animate) {
        id = requestAnimationFrame(setup);
    }

}


function divideSquare(){
    square(va, vb, vc, vd, numTimesToSubdivide);
    square(ve,vf,vg,vh,numTimesToSubdivide);
    square(ve,vf,vd,vb,numTimesToSubdivide);
    square(ve,vh,vd,va,numTimesToSubdivide);
    square(vg,vh,vc,va,numTimesToSubdivide);
    square(vg,vf,vc,vb,numTimesToSubdivide);
}

function chaikin(vertices, iterations) {
    // Recursive end condition
    if (iterations === 0) {
        return vertices;
    }

    // New vertices after corner-cutting
    var newVertices = [];

    // Constant corner cutting ratio of 1/4
    var ratio = 0.25;

    for (let i = 0; i < vertices.length - 1; i++) {
        // Get starting and ending vertices of line segment to cut
        var v0 = vertices[i];
        var v1 = vertices[i + 1];

        // Cut vertices and add to list
        // Calculate first new point
        var p0 = mix(v0, v1, ratio);

        // Calculate second new point
        var p1 = mix(v0, v1, (1.0 - ratio));
        newVertices.push(p0, p1);
    }
    var v0 = vertices[vertices.length - 1];
    var v1 = vertices[0];

    // Cut vertices and add to list
    // Calculate first new point
    var p0 = mix(v0, v1, ratio);

    // Calculate second new point
    var p1 = mix(v0, v1, (1.0 - ratio));
    newVertices.push(p0, p1);

    // Recursively call to subdivide
    return chaikin(newVertices, iterations - 1);
}

function aboveOrBelow(nextLine, currentLine){

    if(nextLine[0]>=currentLine[0] && nextLine[1]>=currentLine[1]){
        return (currentLine[0]+nextX >= nextLine[0] && currentLine[1]+nextY >=nextLine[1]);
    }
    if(nextLine[0]<=currentLine[0] && nextLine[1]>=currentLine[1]){
    return (currentLine[0]+nextX <= nextLine[0] && currentLine[1]+nextY >=nextLine[1]);
    }
    if(nextLine[0]>=currentLine[0] && nextLine[1]<=currentLine[1]){
    return (currentLine[0]+nextX >= nextLine[0] && currentLine[1]+nextY <=nextLine[1]);
    }
    if(nextLine[0]<=currentLine[0] && nextLine[1]<=currentLine[1]){
    return (currentLine[0]+nextX <= nextLine[0] && currentLine[1]+nextY <=nextLine[1]);
    }
}
var canvas;
var gl;

var numTimesToSubdivide = 0;

var index = 0;

var pointsArray = [];
var normalsArray = [];
var flatShadingArray = [];

var near = .1;
var far = 100;


//side 1
var va = normalize(vec4(1.0, 1.0, 1.0,1));
var vb = normalize(vec4(-1.0, -1.0, 1.0, 1));
var vc = normalize(vec4(-1.0, 1.0, 1.0, 1));
var vd = normalize(vec4(1.0, -1.0, 1.0, 1));
//side 2
var ve = normalize(vec4(1.0, -1.0, -1.0, 1));
var vf = normalize(vec4(-1.0, -1.0, -1.0, 1));
var vg = normalize(vec4(-1.0, 1.0, -1.0, 1));
var vh = normalize(vec4(1.0, 1.0, -1.0, 1));

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
var at = vec3(0, 0, 0.0);
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
    if(event.key === "q"){
        if(numTimesToSubdivide !== 0) {
            numTimesToSubdivide-=1;
        }
    }
    if(event.key==="e"){
        if(numTimesToSubdivide !== 5)
            numTimesToSubdivide+=1;
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
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

   setup();

    render();
}
function setup(){
    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    divideSquare();

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


}
var id;
function render() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3(5,0, 40);

    modelViewMatrix = lookAt(eye, at , up);
    var fovy = 30;
    projectionMatrix = perspective(fovy,1,near,far);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    for( var i=0; i<index; i+=3)
        gl.drawArrays( gl.TRIANGLES, i, 3 );

    id=requestAnimationFrame(render);
}

function divideSquare(){
    square(va, vb, vc, vd, numTimesToSubdivide);
    square(ve,vf,vg,vh,numTimesToSubdivide);
    square(ve,vf,vd,vb,numTimesToSubdivide);
    square(ve,vh,vd,va,numTimesToSubdivide);
    square(vg,vh,vc,va,numTimesToSubdivide);
    square(vg,vf,vc,vb,numTimesToSubdivide);
}
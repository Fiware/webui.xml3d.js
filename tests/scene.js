module("RenderScene", {
    setup : function() {
        this.scene = new XML3D.webgl.Scene();
        this.xflowGraph = new Xflow.Graph();

    }
});

test("Lights", 16, function(){

    var dataNode = this.xflowGraph.createDataNode(false);

    var light = this.scene.createRenderLight({
        light: {
            data: dataNode
        }
    });

    equal(light.localIntensity, 1.0, "Local intensity default");
    var actualVector = new XML3DVec3();
    actualVector.set(light.intensity);
    QUnit.closeVector(actualVector, new XML3DVec3(1,1,1), EPSILON, "Intensity default");

    equal(this.scene.lights.queue.length, 1, "Invalid light is in queue");
    light.setLightType("directional");
    equal(light.light.type, "directional");

    equal(this.scene.lights.queue.length, 0, "Valid light is not in queue");
    equal(this.scene.lights.directional.length, 1, "Valid directional light is in 'scene.lights.directional'");
    //strictEqual(this.scene.lights.directional[0], light, "Valid directional light is in 'scene.lights.directional'");

    this.scene.addEventListener(XML3D.webgl.Scene.EVENT_TYPE.LIGHT_STRUCTURE_CHANGED, function(event) {
        ok(event.light, "Light passed as parameter in structure changed callback");
        start();
    });

    stop();
    light.setLightType("spot");

    var group = this.scene.createRenderGroup();

    stop();
    light = this.scene.createRenderLight({
        parent : group,
        light: {
            data: dataNode,
            type: "point"
        }
    });

    ok(light.parent === group);
    equal(this.scene.lights.point.length, 1, "Valid directional light is in 'scene.lights.point'");

    this.scene.addEventListener(XML3D.webgl.Scene.EVENT_TYPE.LIGHT_VALUE_CHANGED, function(event) {
        ok(true, "Value changed callback");
        start();
    });

    stop(6);
    light.setLocalIntensity(0.5);
    group.setLocalVisible(false);
    group.setLocalVisible(true);
    light.setVisible(false);
    light.setVisible(true);
    group.setLocalMatrix(XML3D.math.mat4.create());

    // REMOVE


});


test("Bounding Boxes", 7, function() {
    var group = this.scene.createRenderGroup();
    group.setLocalMatrix(XML3D.math.mat4.create());
    var obj = this.scene.createRenderObject();
    obj.setObjectSpaceBoundingBox([-2, -2, -2], [2, 2, 2]);
    obj.setParent(group);

    var actualBB = new XML3D.webgl.BoundingBox();
    group.getWorldSpaceBoundingBox(actualBB);
    QUnit.closeBox(actualBB.getAsXML3DBox(), new XML3DBox(new XML3DVec3(-2,-2,-2),new XML3DVec3(2,2,2)) , EPSILON, "Group BB matches object BB");

    var trans = XML3D.math.mat4.create();
    XML3D.math.mat4.translate(trans, trans, [4, 0, 0]);
    group.setLocalMatrix(trans);
    group.getWorldSpaceBoundingBox(actualBB);
    QUnit.closeBox(actualBB.getAsXML3DBox(), new XML3DBox(new XML3DVec3(2,-2,-2),new XML3DVec3(6,2,2)) , EPSILON, "Group BB was translated correctly");

    var group2 = this.scene.createRenderGroup();
    var trans2 = XML3D.math.mat4.create();
    XML3D.math.mat4.translate(trans2, trans2, [0, 4, 0]);
    group2.setLocalMatrix(trans2);

    var obj2 = this.scene.createRenderObject();
    obj2.setObjectSpaceBoundingBox([-1, -1, -1], [1, 1, 1]);
    obj2.setParent(group2);
    group2.setParent(group);
    group2.getWorldSpaceBoundingBox(actualBB);
    QUnit.closeBox(actualBB.getAsXML3DBox(), new XML3DBox(new XML3DVec3(-1,3,-1),new XML3DVec3(1,5,1)) , EPSILON, "New group's transform was applied correctly");
    group.getWorldSpaceBoundingBox(actualBB);
    QUnit.closeBox(actualBB.getAsXML3DBox(), new XML3DBox(new XML3DVec3(2,-2,-2),new XML3DVec3(6,5,2)) , EPSILON, "Original group's BB was expanded correctly");
    obj2.setLocalVisible(false);
    group.getWorldSpaceBoundingBox(actualBB);
    QUnit.closeBox(actualBB.getAsXML3DBox(), new XML3DBox(new XML3DVec3(2,-2,-2),new XML3DVec3(6,2,2)) , EPSILON, "Making new object invisible reverts original group's BB");

    obj2.setLocalVisible(true);
    group.getWorldSpaceBoundingBox(actualBB);
    QUnit.closeBox(actualBB.getAsXML3DBox(), new XML3DBox(new XML3DVec3(2,-2,-2),new XML3DVec3(6,5,2)) , EPSILON, "Object is visible again");
    group.setLocalMatrix(XML3D.math.mat4.create());
    group.getWorldSpaceBoundingBox(actualBB);
    QUnit.closeBox(actualBB.getAsXML3DBox(), new XML3DBox(new XML3DVec3(-2,-2,-2),new XML3DVec3(2,5,2)) , EPSILON, "Original group's transformation removed");
});

test("Annotated Bounding Box", function() {
    var dataNode = this.xflowGraph.createDataNode(false);
    var obj = this.scene.createRenderObject({
        object : {
            data: dataNode
        }
    });
    strictEqual(obj.object.data, dataNode, "Xflow data source is set in RenderObject");
    var actualBB = new XML3D.webgl.BoundingBox();
    this.scene.getBoundingBox(actualBB);
    ok(actualBB.isEmpty(), "No data annotated: BB is empty");
    ok(!obj.boundingBoxAnnotated, "RenderObject marked as not annotated");

    var buffer = new Xflow.BufferEntry(Xflow.DATA_TYPE.FLOAT3, new Float32Array([-2,-2,-2,2,2,2]));
    var xflowInputNode = XML3D.data.xflowGraph.createInputNode();
    xflowInputNode.name = "boundingBox";
    xflowInputNode.data = buffer;
    dataNode.appendChild(xflowInputNode);

    this.scene.rootNode.getWorldSpaceBoundingBox(actualBB);
    QUnit.closeBox(actualBB.getAsXML3DBox(), new XML3DBox(new XML3DVec3(-2,-2,-2),new XML3DVec3(2,2,2)) , EPSILON, "Group BB matches annotated BB");
    ok(obj.boundingBoxAnnotated, "RenderObject marked as annotated");

});
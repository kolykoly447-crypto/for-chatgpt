extends Node3D

var phase: float = 0.0
var _time: float = 0.0
var _origin: Vector3

func _ready() -> void:
    _origin = position
    _create_body()

func _process(delta: float) -> void:
    _time += delta
    position = _origin + Vector3(sin(_time * 0.42 + phase) * 3.2, sin(_time * 0.8 + phase) * 0.55, cos(_time * 0.34 + phase) * 2.1)
    rotation.y = atan2(cos(_time * 0.42 + phase), -sin(_time * 0.42 + phase))

func _create_body() -> void:
    var body := MeshInstance3D.new()
    var body_mesh := SphereMesh.new()
    body_mesh.radius = 0.62
    body_mesh.height = 0.9
    body.mesh = body_mesh
    body.scale = Vector3(1.55, 0.72, 0.72)
    var mat := StandardMaterial3D.new()
    mat.albedo_color = Color(0.23, 0.56, 0.62)
    mat.roughness = 0.46
    body.material_override = mat
    add_child(body)

    var eye_mat := StandardMaterial3D.new()
    eye_mat.albedo_color = Color(0.015, 0.025, 0.04)
    for side in [-1.0, 1.0]:
        var eye := MeshInstance3D.new()
        var eye_mesh := SphereMesh.new()
        eye_mesh.radius = 0.09
        eye_mesh.height = 0.14
        eye.mesh = eye_mesh
        eye.position = Vector3(0.33, 0.17, side * 0.42)
        eye.material_override = eye_mat
        add_child(eye)

    var tail := MeshInstance3D.new()
    var tail_mesh := SphereMesh.new()
    tail_mesh.radius = 0.32
    tail_mesh.height = 0.7
    tail.mesh = tail_mesh
    tail.position = Vector3(-0.88, 0.0, 0.0)
    tail.scale = Vector3(0.4, 1.25, 0.18)
    tail.material_override = mat
    add_child(tail)

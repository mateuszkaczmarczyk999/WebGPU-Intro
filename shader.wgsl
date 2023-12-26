struct VertexInput {
    @location(0) pos: vec2f,
    @builtin(instance_index) instance: u32,
};

struct VertexOutput {
    @location(0) cell: vec2f,
    @builtin(position) pos: vec4f,
};

@group(0) @binding(0) var<uniform> grid: vec2f;
@group(0) @binding(1) var<storage> cellState: array<u32>;

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
    let idx = f32(input.instance);
    let state = f32(cellState[input.instance]);

    let cell = vec2f(idx % grid.x, floor(idx / grid.y));
    let cellOffset = cell / grid * 2;

    let gridPos = (input.pos*state+1) / grid - 1 + cellOffset;

    var output: VertexOutput;
    output.cell = cell;
    output.pos = vec4f(gridPos, 0, 1);
    return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
    let c = input.cell / grid;
    return vec4f(c, 1 - c.y, 1);
}

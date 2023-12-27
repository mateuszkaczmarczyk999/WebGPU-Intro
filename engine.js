export const initialize = async () => {
    if (!navigator.gpu) throw new Error("WebGPU not supported on this browser.");
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error("No appropriate GPUAdapter found.");
    const device = await adapter.requestDevice();
    const queue = device.queue;
    const canvas = document.querySelector("canvas");
    const context = canvas.getContext("webgpu");
    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ device, format });

    return { device, queue, context, format };
}

const loadShader = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to load shader: ${url}`);
    }
    return response.text();
}

export const getDrawShaderModule = async (device) => {
    const shaderCode = await loadShader('drawShader.wgsl');
    return device.createShaderModule({ label: "Cell shader", code: shaderCode });
}

export const getSimulationShaderModule = async (device) => {
    const shaderCode = await loadShader('simulationShader.wgsl');
    return device.createShaderModule({ label: "Game of Life simulation shader", code: shaderCode });
}

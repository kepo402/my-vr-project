import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { EmulatorSettings } from './settings'; // Adjust path if needed

const SBSVideoPlayer = () => {
    const [mode, setMode] = useState(EmulatorSettings.instance.mode || 'normal');
    const modeToggleRef = useRef(null);

    // Toggle between modes
    const onToggleMode = () => {
        setMode(prevMode => {
            const newMode = prevMode === 'normal' ? 'nonStereoVR' :
                            (prevMode === 'nonStereoVR' ? 'stereoVR' : 'normal');
            EmulatorSettings.instance.mode = newMode;
            if (modeToggleRef.current) {
                modeToggleRef.current.classList.toggle('button-pressed', newMode === 'stereoVR');
            }
            EmulatorSettings.instance.write();
            return newMode;
        });
    };

    useEffect(() => {
        const container = document.getElementById('container');
        const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 2000);
        const scene = new THREE.Scene();
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.xr.enabled = true;
        renderer.xr.setReferenceSpaceType('local');
        container.appendChild(renderer.domElement);

        // Comment out or remove the WebXR button for testing
        // const vrButton = VRButton.createButton(renderer);
        // document.body.appendChild(vrButton);

        const video = document.createElement('video');
        video.src = 'demo_sbs.mp4'; // Replace with the path to your local video file
        video.crossOrigin = 'anonymous';
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.load();
        video.play().catch(error => console.error("Video play failed: ", error));

        const videoTexture = new THREE.VideoTexture(video);
        videoTexture.minFilter = THREE.LinearFilter;

        const geometry = new THREE.PlaneGeometry(16, 9); // 16:9 aspect ratio

        const createMaterial = (offset, repeat) => {
            const material = new THREE.MeshBasicMaterial({
                map: videoTexture.clone(),
                side: THREE.DoubleSide
            });
            material.map.offset.set(offset, 0);
            material.map.repeat.set(repeat, 1);
            return material;
        };

        // Create video meshes for each mode
        const videoMeshNormal = new THREE.Mesh(geometry, createMaterial(0, 1)); // Full video for normal mode
        const videoMeshNonStereoRight = new THREE.Mesh(geometry, createMaterial(0.5, 0.5)); // Right half for nonStereoVR mode
        const videoMeshStereoLeft = new THREE.Mesh(geometry, createMaterial(0, 0.5)); // Left half for stereoVR mode
        const videoMeshStereoRight = new THREE.Mesh(geometry, createMaterial(0.5, 0.5)); // Right half for stereoVR mode

        // Add video meshes to scene
        scene.add(videoMeshNormal);
        scene.add(videoMeshNonStereoRight);
        scene.add(videoMeshStereoLeft);
        scene.add(videoMeshStereoRight);

        // Set initial positions
        videoMeshNormal.position.set(0, 0, -20);
        videoMeshNonStereoRight.position.set(0, 0, -20);
        videoMeshStereoLeft.position.set(-10, 0, -20);
        videoMeshStereoRight.position.set(10, 0, -20);

        // Set initial visibility
        videoMeshNormal.visible = false;
        videoMeshNonStereoRight.visible = false;
        videoMeshStereoLeft.visible = false;
        videoMeshStereoRight.visible = false;

        const updateVisibility = () => {
            console.log(`Updating visibility for mode: ${mode}`);
            switch (mode) {
                case 'stereoVR':
                    videoMeshNormal.visible = false;
                    videoMeshNonStereoRight.visible = false;
                    videoMeshStereoLeft.visible = true;
                    videoMeshStereoRight.visible = true;
                    console.log('Stereo VR mode active: Left and Right meshes visible');
                    break;
                case 'nonStereoVR':
                    videoMeshNormal.visible = false;
                    videoMeshNonStereoRight.visible = true;
                    videoMeshStereoLeft.visible = false;
                    videoMeshStereoRight.visible = false;
                    console.log('Non-Stereo VR mode active: Right mesh visible');
                    break;
                default: // 'normal'
                    videoMeshNormal.visible = true;
                    videoMeshNonStereoRight.visible = false;
                    videoMeshStereoLeft.visible = false;
                    videoMeshStereoRight.visible = false;
                    console.log('Normal mode active: Full video mesh visible');
                    break;
            }
        };

        const onSessionStart = () => {
            console.log('VR session started');
            updateVisibility();
        };

        const onSessionEnd = () => {
            console.log('VR session ended');
            updateVisibility();
        };

        renderer.xr.addEventListener('sessionstart', onSessionStart);
        renderer.xr.addEventListener('sessionend', onSessionEnd);

        const animate = () => {
            if (videoTexture && videoTexture.image && videoTexture.image.readyState >= videoTexture.image.HAVE_CURRENT_DATA) {
                videoTexture.needsUpdate = true;
            }
            renderer.render(scene, camera);
            renderer.setAnimationLoop(animate);
        };

        animate();

        const onWindowResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', onWindowResize);

        // Initial visibility update
        updateVisibility();

        return () => {
            window.removeEventListener('resize', onWindowResize);
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
            // Remove WebXR button if it was added
            // if (document.body.contains(vrButton)) {
            //     document.body.removeChild(vrButton);
            // }
        };
    }, [mode]);

    return (
        <div>
            <button
                className={mode === 'stereoVR' ? 'btn headset-action-button button-pressed' : 'btn headset-action-button'}
                ref={modeToggleRef}
                onClick={onToggleMode}
            >
                <img src="./assets/images/stereo.png" className="action-icon" alt="Mode" />
                {mode === 'normal' ? 'Normal' : 
                 mode === 'nonStereoVR' ? 'Non-Stereo' : 
                 'Stereo VR'}
            </button>
            <div id="container"></div>
        </div>
    );
};

export default SBSVideoPlayer;


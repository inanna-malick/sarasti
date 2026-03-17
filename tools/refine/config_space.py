PARAMETER_GROUPS = [
    {
        "name": "eye_shader",
        "keys": ["irisRadius", "pupilRadius"],
        "bounds": [(0.08, 0.40), (0.03, 0.15)],
        "defaults": [0.26, 0.09],
    },
    {
        "name": "jaw_mapping",
        "keys": ["maxJaw"],
        "bounds": [(0.05, 0.50)],
        "defaults": [0.2],
    },
    {
        "name": "expression_intensity",
        "keys": ["expressionIntensity", "semantifyExprIntensity"],
        "bounds": [(3.0, 25.0), (2.0, 20.0)],
        "defaults": [15.0, 12.0],
    },
    {
        "name": "pose_amplitude",
        "keys": ["maxNeckPitch", "maxNeckYaw"],
        "bounds": [(0.05, 0.50), (0.05, 0.50)],
        "defaults": [0.25, 0.30],
    },
    {
        "name": "gaze_amplitude",
        "keys": ["maxEyeHorizontal", "maxEyeVertical"],
        "bounds": [(0.10, 0.60), (0.10, 0.50)],
        "defaults": [0.35, 0.25],
    },
    {
        "name": "curve_steepness",
        "keys": ["deviationSteepness", "velocitySteepness"],
        "bounds": [(1.0, 8.0), (1.0, 6.0)],
        "defaults": [4.0, 3.0],
    },
]

# Replacing temporary renders with 3D models

The Studio currently reads one independent PNG per work from `public/generated/`.

To switch a work to a real model:

1. Export an optimized `.glb` file into this directory.
2. Keep the model centered at the origin, with Y as up and applied transforms.
3. Use compressed textures and target a total file size below 5 MB per work.
4. In `src/data/works.ts`, change the work asset to:

```ts
asset: {
  type: "model",
  src: "/generated/the-existing-fallback.png",
  modelSrc: "/models/your-work.glb",
  scale: 1.0,
}
```

The PNG stays as the accessible/card fallback and for low-power devices.

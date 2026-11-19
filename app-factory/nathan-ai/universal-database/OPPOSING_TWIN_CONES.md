# Opposing Twin Cones — geometry extension

## Geometry
Two coaxial cones face tip-to-tip at the D0 transition:
- Upper cone: wide at its upper end; radius decreases as vertical position moves downward.
- Lower cone: wide at its lower end; radius decreases as vertical position moves upward.
- At the central interface, each cone reaches its minimum playable radius. For rendering, use a small positive radius rather than zero to keep rings selectable.

Use normalized axial distance t in [0,1], measured from each cone's wide outer rim toward its inner tip. Radius = r_tip + (r_wide - r_tip)*(1-t). Upper y = -height*(1-t); lower y = height*(1-t). Both share the same axis and meet at the center.

## Dimensional mapping
Keep the coordinate model independent of the shape: forward D0..D9, inverted 01D..12D (= D10..D21), and negative -1D, -2D, ... unbounded. A cone segment is a visualization projection of a finite viewport over coordinates, not proof that negative infinity has a physical endpoint. The magnetic flip D9 -> 01D and configurable firmament rebound remain explicit graph transitions. Do not assign a firmament boundary without a rule.

## Renderer interface
```js
export function coneRing({side, progress, wideRadius=150, tipRadius=8, height=200}) {
  if (!["upper","lower"].includes(side) || !Number.isFinite(progress) || progress<0 || progress>1) throw new RangeError("invalid cone ring");
  const radius=tipRadius+(wideRadius-tipRadius)*(1-progress);
  const y=(side==="upper"?-1:1)*height*(1-progress);
  return {x:0,y,z:0,radius,side,progress};
}
```

## Interaction
- Rotating the 3D Track Baller rotates the shared axis and both cones as one object, unless a game explicitly opts for independent spin.
- Pinch zoom changes view scale, not logical dimension or ring radius.
- Swipes navigate dimension links; magnetic crossing reverses the specified clockwise orientation.
- Firmament flip applies only when a configured boundary is reached.

## Status
Design specification committed to GitHub; no claim of a deployed renderer or Cloudflare schema update. Keep each independent app separately scoped.

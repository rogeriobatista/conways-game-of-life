export type ArcadeRoute =
  | { kind: 'hub' }
  | { kind: 'meteor'; screen: 'menu' | 'play' | 'builder' }
  | { kind: 'invaders'; screen: 'menu' | 'play' | 'builder' }

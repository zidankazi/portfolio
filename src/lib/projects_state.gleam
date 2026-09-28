pub type Model {
  Model(pinned: Bool, hovered: Bool, focused: Bool, can_hover: Bool)
}

pub type Event {
  MouseEntered
  MouseLeft
  FocusEntered
  FocusLeft
  TogglePinned
  HoverCapabilityChanged(can_hover: Bool)
}

pub fn init() -> Model {
  Model(pinned: False, hovered: False, focused: False, can_hover: True)
}

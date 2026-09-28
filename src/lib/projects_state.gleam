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

pub fn update(model: Model, event: Event) -> Model {
  case event {
    MouseEntered if model.can_hover -> Model(..model, hovered: True)
    MouseLeft if model.can_hover -> Model(..model, hovered: False)
    MouseEntered | MouseLeft -> model
    FocusEntered -> Model(..model, focused: True)
    FocusLeft -> Model(..model, focused: False)
    TogglePinned -> Model(..model, pinned: !model.pinned)
    HoverCapabilityChanged(can_hover) -> Model(..model, can_hover: can_hover)
  }
}

pub fn is_open(model: Model) -> Bool {
  model.pinned || model.can_hover && { model.hovered || model.focused }
}

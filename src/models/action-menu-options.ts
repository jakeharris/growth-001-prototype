export enum ActionMenuOptions {
  Attack,
  Wait,
}

export function getActionName(action: ActionMenuOptions) {
  switch (action) {
    case ActionMenuOptions.Attack:
      return "Attack";
    case ActionMenuOptions.Wait:
      return "Wait";
  }
}

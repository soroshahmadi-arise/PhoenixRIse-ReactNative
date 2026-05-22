export type ButtonVariant = 'primary' | 'secondary';

export type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
};

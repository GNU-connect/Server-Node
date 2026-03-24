import * as Sentry from '@sentry/node';

type TraceAttributeValue = string | number | boolean | null | undefined;
type TraceAttributes = Record<string, TraceAttributeValue>;
type TraceAttributesFactory = (
  args: unknown[],
  context: { className: string; methodName: string },
) => TraceAttributes;

interface TraceSpanOptions {
  name: string;
  op: string;
  attributes?: TraceAttributes | TraceAttributesFactory;
}

const normalizeAttributes = (
  attributes?: TraceAttributes,
): Record<string, string | number | boolean> | undefined => {
  if (!attributes) {
    return undefined;
  }

  const normalizedEntries = Object.entries(attributes).filter(
    (entry): entry is [string, string | number | boolean] => {
      const value = entry[1];
      return value !== undefined && value !== null;
    },
  );

  if (normalizedEntries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(normalizedEntries);
};

export function TraceSpan(options: TraceSpanOptions): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const originalMethod = descriptor.value;

    if (typeof originalMethod !== 'function') {
      return descriptor;
    }

    descriptor.value = function (...args: unknown[]) {
      const attributes =
        typeof options.attributes === 'function'
          ? options.attributes(args, {
              className: target.constructor.name,
              methodName: String(propertyKey),
            })
          : options.attributes;

      return Sentry.startSpan(
        {
          name: options.name,
          op: options.op,
          attributes: normalizeAttributes(attributes),
        },
        () => originalMethod.apply(this, args),
      );
    };

    return descriptor;
  };
}

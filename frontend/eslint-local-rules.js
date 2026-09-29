export default {
  'no-config-component-direct-inputs': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Disallow direct inputs on *-config components',
      },
      messages: {
        noDirectInput: 'Input "{{ inputName }}" not allowed on {{ componentName }}. Use [config] instead.',
      },
    },
    create (context) {
      return {
        Program (node) {
          const filename = context.getFilename();

          if (!filename.endsWith('.html')) {
            return;
          }

          const sourceCode = context.getSourceCode();
          const text = sourceCode.getText();

          const configComponentRegex = /<([\w-]+-config)\s+([^>]+)>/g;
          console.log(sourceCode);
          console.log(text);

          let match;
          while ((match = configComponentRegex.exec(text)) !== null) {
            const componentName = match[1];
            const attributesString = match[2];

            const attributeRegex = /\[?(\w+)\]?\s*=/g;
            let attrMatch;

            while ((attrMatch = attributeRegex.exec(attributesString)) !== null) {
              const inputName = attrMatch[1];

              if (inputName !== 'config') {
                const start = match.index + match[0].indexOf(attrMatch[0]);

                context.report({
                  loc: {
                    start: sourceCode.getLocFromIndex(start),
                    end: sourceCode.getLocFromIndex(start + attrMatch[0].length),
                  },
                  messageId: 'noDirectInput',
                  data: {
                    inputName,
                    componentName,
                  },
                });
              }
            }
          }
        },
      };
    },
  },
};

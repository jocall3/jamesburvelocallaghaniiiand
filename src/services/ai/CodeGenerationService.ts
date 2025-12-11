```typescript
import { Injectable } from '@nestjs/common';
import { Configuration, OpenAIApi } from 'openai';
import { FigmaComponent } from './figma.types';

@Injectable()
export class CodeGenerationService {
  private openai: OpenAIApi;

  constructor() {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.openai = new OpenAIApi(configuration);
  }

  async generateCode(component: FigmaComponent, language: string): Promise<string> {
    try {
      const prompt = this.createPrompt(component, language);
      const completion = await this.openai.createChatCompletion({
        model: 'gpt-3.5-turbo', // Or another suitable model
        messages: [{ role: 'user', content: prompt }],
      });

      if (!completion.data.choices || completion.data.choices.length === 0) {
        throw new Error('No choices returned from OpenAI');
      }

      const code = completion.data.choices[0].message?.content || '';
      return code;

    } catch (error) {
      console.error('Error generating code:', error);
      throw new Error(`Failed to generate code: ${error.message}`);
    }
  }

  private createPrompt(component: FigmaComponent, language: string): string {
    let prompt = `Generate ${language} code for a Figma component. \n\n`;

    prompt += `Component Name: ${component.name}\n`;
    prompt += `Component Description: ${component.description || 'No description provided.'}\n`;
    prompt += `Component Type: ${component.type}\n`; // e.g., Frame, Rectangle, Text, etc.

    // Basic properties (can be expanded significantly)
    if (component.absoluteBoundingBox) {
        prompt += `Bounding Box: x=${component.absoluteBoundingBox.x}, y=${component.absoluteBoundingBox.y}, width=${component.absoluteBoundingBox.width}, height=${component.absoluteBoundingBox.height}\n`;
    }

    if (component.fills && component.fills.length > 0) {
      prompt += `Fills:\n`;
      component.fills.forEach(fill => {
        if (fill.type === 'SOLID') {
          prompt += `  - Solid color: rgba(${fill.color.r * 255}, ${fill.color.g * 255}, ${fill.color.b * 255}, ${fill.color.a})\n`;
        } else if (fill.type === 'IMAGE' && fill.imageRef) {
          prompt += `  - Image: URL: ${fill.imageRef} , scaleMode: ${fill.scaleMode}\n`;
        }
      });
    }


    if (component.strokes && component.strokes.length > 0) {
      prompt += `Strokes:\n`;
      component.strokes.forEach(stroke => {
        if (stroke.type === 'SOLID') {
          prompt += `  - Solid color: rgba(${stroke.color.r * 255}, ${stroke.color.g * 255}, ${stroke.color.b * 255}, ${stroke.color.a}), weight: ${component.strokeWeight}, align: ${component.strokeAlign} \n`;
        }
      });
    }

    if (component.cornerRadius){
      prompt += `Corner Radius: ${component.cornerRadius}\n`;
    }
    if (component.rectangleCornerRadii){
        prompt += `Rectangle Corner Radii: ${component.rectangleCornerRadii.join(',')}\n`;
    }


    if (component.type === 'TEXT' && component.style) {
      prompt += `Text Content: ${component.characters}\n`;
      prompt += `Text Style: fontFamily=${component.style.fontFamily}, fontSize=${component.style.fontSize}, fontWeight=${component.style.fontWeight},  letterSpacing=${component.style.letterSpacing}, lineHeight=${component.style.lineHeightPx}\n`;
    }

    if (component.children && component.children.length > 0) {
      prompt += `Children:\n`;
      component.children.forEach(child => {
        prompt += `  - Child Type: ${child.type}, Name: ${child.name}\n`;
      });
    }



    prompt += `\nGenerate the code, and format the output with proper indentation and appropriate comments.  Provide only the code, without any surrounding text or explanations.  The generated code should be ready for use.\n`;

    return prompt;
  }
}
```
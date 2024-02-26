# Using annotations to create templates with Markdown

> **Disclaimer**:
> We are only supporting Mustache features that are explained in this guide. We are not responsible for other features that Mustache is supporting. Those features might or might not work in context of ERMrestJS.

For information on the annotation **tag:isrd.isi.edu,2016:column-display** specifics you can refer to this [document](annotation.md#tag-2016-column-display)

The annotation is represented as follows:

```javascript
{
   "CONTEXT_NAME" : {
       "markdown_pattern": "[{{{title}}}](https://example.com/chaise/search?name={{{name}}})"
   }
}
```

The `markdown_pattern` parameter of the annotation accepts a Markdown string which can contain templated columns for replacing them with their formatted values. It uses [Mustache](mustache-templating.md) or [Handlebars](handlebars.md) for templating and returns a Markdown string.


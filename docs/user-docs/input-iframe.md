# Input iframe

This document will cover how to include any third-party tools inside the Chaise's recordedit app. In summary, you must add the `input_iframe` property to one of the visible columns. Chaise will then display a special input for this visible column. Clicking on this input will open a modal to show the third-party tool in an iframe.

In the following, we will first go over what we expect from the iframe and mention how Chaise and iframe should communicate. We then will review the `input_iframe` property that should be added to annotations.  In the [limitations](#limitations) section, we will go over the limitations and assumptions in the current implementation of this feature.

## Iframe communication

As mentioned, the third-party tool will be displayed in an iframe in Chaise. To facilitate this, you should start with [this template](input-iframe-template.html) we've prepared for implementing this iframe page. In the following, we will go over different parts of this template.

Given that the third-party tool is in an iframe, we can use [`postMessage()` function](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) to exchange messages between the app and Chaise. In the template, we've created a `dispatchMessage` function allowing you to send messages to Chaise.

When Chaise loads the iframe app, it will wait for the iframe to send a message with `type="iframe-ready"` to signal that it's ready to receive data. Chaise will then send the data with a `type="initialize-iframe"` message. You can see how, in the template, we're calling the `configureIframe` after receiving this message from Chaise. In this function, you should use the Chaise data to initialize your app. When the app is ready, you can call the `dataReady()` function. This function sends Chaise a message with `type="iframe-data-ready"`. To send data back to Chaise, you should send a message with `type="submit-data"` alongside the data that Chaise needs.

Notes:
- As we will mention in the [annotation](#annotation) section, Chaise allows you to define the mapping between database columns and the data that iframe receives/sends. Therefore, in the iframe code, you just need to work with one set of names for the fields and don't need to worry about column mapping. Chaise will handle that for you.
- For asset columns, Chaise will send the hatrac URL of the existing file to the iframe. So, to use its content, you first need to download it. Chaise also expects iframe to provide a JavaScript `File` object for such fields. The following is an example of turning a string content into a `File` object:
  ```js
  const blob = new Blob([fileContent], { type: 'application/json' });
  const file = new File([blob], 'input_iframe.json', { type: 'application/json' });
  ```

## Annotation

Now that you know how the iframe should be implemented, let's discuss the annotation. To turn this feature on, we must add the `input_iframe` object to one of the visible-columns. The following is the accepted syntax and available properties under `input_iframe`:

```
{
  ...,
  "input_iframe": {
    "url_pattern": <pattern>,
    "field_mapping": <object>,
    "optional_fields": <array of field names>
  }
}
```

> When users select a value for this input, we will show the raw value of the column that this property is defined on. So, it's important to use a `source` that will be populated by the iframe. That's why in the examples in this document, we're using `"source": "ID"` which is populated by the iframe and identifies the chosen value.

`url_pattern` and `field_mapping` are required. While `optional_fields` is optional.

### url_pattern

Allows you to define the location of this third-party tool. We recommend installing this tool in your deployment to avoid any cross-origin issues. In [this document](https://github.com/informatics-isi-edu/deriva-react-template/blob/main/docs/dev-docs/dev-guide.md#recommended-location-for-the-apps), we added our recommended location for any apps that you might have in your deployment. For instance, you could use `/apps/myapp/index.html`.

As the name suggests, you can also use [handlebars](handlebars.md) or [mustache](mustache-templating.md) patterns in its value. This will allow you to use [pre-defined attributes] or column values in your pattern. But be mindful, since this is in recordedit, depending on users already selected values in the form, some column values might not be present.

If you're planning to use a different template engine than the default one, you also need to define `template_engine`, for example:

```
{
  ...,
  "input_iframe": {
    "url_pattern": "/apps/myapp/index.html{{#if Consortium}}?consortium={{{Consortium}}}{{/if}}",
    "template_engine": "handlebars",
    ...
  }
}
```

That being said, in most cases you don't need to use pattern and just a static value should be enough:

```
{
  "source": "ID",
  "input_iframe": {
    "url_pattern": "/apps/myapp/index.html",
    ...
  }
}
```


### field_mapping

The fields that the iframe users might have different names from the database column. You can also change the model without changing the code. That's why you need to define the mapping between iframe fields and column names as part of this annotation.

The `field_mapping` must be an object where keys are the names used in the iframe and values are column names. For instance,

```json
{
  "source": "ID",
  "input_iframe": {
    "url_pattern": "/apps/myapp/index.html",
    "field_mapping": {
       "hra_id": "ID",
       "hra_file": "URI",
        "hra_creator": "Principal_Investigator",
        "hra_notes": "Notes"
    }
  }
}
```

With this, we expect the iframe to return an object with `hra_id`, `hra_file`, and `hra_creator` field. And Chaise will store their values in `ID`, `URI`, and `Principal_Investigator` columns.

### optional_fields

We expect the iframe to return values for all the fields noted under `field_mapping`; we will complain if we don't receive it. If some fields are unavailable in some scenarios, you should list them with `optional_fields`.   For example,

```json
{
  "source": "ID",
  "input_iframe": {
    "url_pattern": "/apps/myapp/index.html",
    "field_mapping": {
       "hra_id": "ID",
       "hra_file": "URI",
        "hra_creator": "Principal_Investigator",
        "hra_notes": "Notes"
    },
    "optional_fields": [ "hra_notes" ]
  }
}
```

## Limitations

Given that this is an experimental feature for now, there are some limitations/assumptions in the implementation of it we've listed below:

- When users select a value for this input, we will show the raw value of the column that this property is defined on. So, it's important to use a `source` that will be populated by the iframe. That's why in the examples in this document, we're using `"source": "ID"` which is populated by the iframe and identifies the chosen value.

- In recordedit, the required inputs are marked with a `*`. These inputs must have a value, and if users attempt to submit the form without a value for them, we will complain. This check for column directives with `input_iframe` is done only based on the column itself. We will not do additional checks to see whether the columns used in the `field_mapping` are required. If the column is not required, but additional columns are, you should consider adding the [required annotation](https://github.com/informatics-isi-edu/ermrestjs/blob/master/docs/user-docs/annotation.md#tag-2018-required) to the column.

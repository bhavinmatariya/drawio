var formattermodal = document.getElementById("formatterDataModal");
var validateBtn = document.getElementById("formatValidateBtn");
var selectedcellData = '';
var selectedSource = '';
var selectedWorkspace = [];
var operators = [
    { type: 'Round off', nb_inputs: 1, apply_to: ['string'] },
    { type: 'Length validation', nb_inputs: 1, apply_to: ['string'] },
    { type: 'Padding', nb_inputs: 1, apply_to: ['string'] },
    { type: 'Trimming', nb_inputs: 1, apply_to: ['string'] },
    { type: 'Formatting', nb_inputs: 1, apply_to: ['string'] },
    { type: 'Concatenation', nb_inputs: 1, apply_to: ['string'] },
    { type: 'Substring', nb_inputs: 1, apply_to: ['string'] },
    { type: 'Data Type Conversion', nb_inputs: 1, apply_to: ['string'] },
    { type: 'Default Value', nb_inputs: 1, apply_to: ['string'] },
    { type: 'Masking', nb_inputs: 1, apply_to: ['string'] },
    { type: 'Case Conversion', nb_inputs: 1, apply_to: ['string'] },
];

var queryBuilderArray = ["Round off",
  "Length validation",
  "Padding",
  "Trimming",
  "Formatting",
  "Concatenation",
  "Substring",
  "Data Type Conversion",
  "Default Value",
  "Masking",
  "Case Conversion"
];

const operatorOptions = {
  "Padding": ["Left", "Right", "Both"],
  "Trimming": ["Left", "Right"],
  "Concatenation": ["Left", "Right"],
  "Case Conversion": ["Upper", "Lower"],
  "Masking": ["First", "Last", "All"]
};

var span = document.getElementById("close-formatterModal");
var formatterOkBtn = document.getElementById("formatterOkBtn");

formatterOkBtn.onclick = function () {
  
  const queryRules = collectRuleData();
  console.log(queryRules);
  let selectedRuleData = {
    filterDataBuilderQuery: {...queryRules}, 
    selectedSource:{...JSON.parse(selectedSource)}
  }
  selectedcellData['selectedRuleData']=JSON.stringify({...selectedRuleData});
  clearListner();
  formattermodal.style.display = "none";
}

validateBtn.onclick = async function () {
    var allFilterCells = allFilterConnectedCells(selectedcellData);
    var allConnectedCellRules = [];
    const queryRules = collectRuleData();
    console.log(queryRules);
    let selectedRuleData = {
      filterDataBuilderQuery: {...queryRules}, 
      selectedSource:{...JSON.parse(selectedSource)}
    }
    selectedcellData['selectedRuleData']=JSON.stringify({...selectedRuleData});
    if(allFilterCells?.length) {
      allFilterCells.forEach((filterCell) => {
        if(filterCell?.selectedRuleData) {
          console.log("======filterCell",filterCell);
          const queryData = JSON.parse(filterCell.selectedRuleData).filterDataBuilderQuery;
          if(queryData) {
            allConnectedCellRules.push(queryData);
          }
        }
      })
    }
    if (!selectedWorkspace.length) {
      alert("workspace data not found");
      return;
    }
    const isWorkSpaceContainNull = selectedWorkspace.some(value => value === null);
    if (isWorkSpaceContainNull) {
      alert("workspace data not found for all connected source");
      return;
    }
    const selectedWorkspaceString = JSON.stringify(selectedWorkspace[0]);
    const ruleData = allConnectedCellRules.reverse();
    console.log("=========ruleData",ruleData);
    const encodedData = ruleData.map(item => {
      console.log('item: ', item)
      const itemUtf8Bytes = new TextEncoder().encode(JSON.stringify(item));
      return btoa(String.fromCharCode(...itemUtf8Bytes));
    });


    const selectedWorkspaceUtf8Bytes = new TextEncoder().encode(selectedWorkspaceString);

    const selectedWorkspaceEncoded = btoa(String.fromCharCode(...selectedWorkspaceUtf8Bytes));
    const payload = {
      "base64": selectedWorkspaceEncoded,
      "rules": encodedData,
    };
    console.log("=========payload",payload);
    $('#filter-loader').show();
    const response = await applyWorkflowRules(payload);
    if(response) {
      $('#filter-loader').hide();
      $('#validateOutput').css('display', 'block');
      $('.validate-copy-btn').css('display', 'block');
      if(!!response.json){
        $('#validateOutput').text(JSON.stringify(JSON.parse(response.json), null, 2));
      }else{
        alert('No valid data found.')
      }
    }
}

span.onclick = function () {
  closeformatterModal();
}

window.onclick = function (event) {
  if (event.target == formattermodal) {
    closeformatterModal();
  }
}

function openformatterModal() {
  formattermodal.style.display = "block";
  if(selectedcellData?.edges?.length) {
    var resultCell = traverseGraph(selectedcellData);

    if(resultCell) {
      if (resultCell.length === 1) {
        $('#formatter-select-source-wrapper').css('display', 'none');
        let cellAttributesData = null;
        cellAttributesData = getJsonDataFromCell(resultCell[0]);
        if (cellAttributesData?.jsonData) {
          selectedSource = JSON.stringify(Object.values(cellAttributesData.jsonData)[0]);
          selectedWorkspace[0] = cellAttributesData?.selectedworkSpaceData;
          const filters = formatterJsonToFilterArray(cellAttributesData.jsonData);
          $(document).ready(function () {
            function addFilterOptions(selectElement) {
              filters.forEach(filter => {
                const filterElement = $('<option></option>').text(filter.id).val(filter.label);
                selectElement.append(filterElement);
              });
            }
            function addOperatorOptions(selectElement) {
              queryBuilderArray.forEach(operator => {
                const optionElement = $('<option></option>').text(operator).val(operator);
                selectElement.append(optionElement);
              });
            }

            function populateDropdownBasedOnOperator(dropdown, operator) {
              dropdown.empty();
              if (operatorOptions[operator]) {
                operatorOptions[operator].forEach(value => {
                  const optionElement = $('<option></option>').text(value).val(value);
                  dropdown.append(optionElement);
                });
                dropdown.closest('.rule-dropdown-container').show();
              } else {
                dropdown.closest('.rule-dropdown-container').hide();
              }
            }

            function updateDeleteButtonVisibility() {
              const ruleContainers = $('.rules-group-container .rule-container');
              ruleContainers.each(function (index) {
                const removeBtn = $(this).find('.remove-rule-btn');
                if (index === 0) {
                  removeBtn.hide();
                } else {
                  removeBtn.show();
                }
              });
            }

            function addRuleRow(rule) {
              var newRule = $('#ruleTemplate').clone().removeAttr('id');
              newRule.find('select').val('');
              newRule.find('input').val('');

              $('.rules-group-container').append(newRule);

              newRule.find('.rule-filter-container select').each(function () {
                $(this).empty();
                addFilterOptions($(this), filters);
                $(this).val(rule.id);
              });

              newRule.find('.rule-operator-container select').each(function () {
                $(this).empty();
                addOperatorOptions($(this));
                $(this).val(rule.operator);
                const selectedOperator = rule.operator;
                const correspondingDropdown = $(this).closest('.rule-wrapper').find('.rule-dropdown-container select');
                populateDropdownBasedOnOperator(correspondingDropdown, selectedOperator);
              }).on('change', function () {
                const selectedOperator = $(this).val();
                const correspondingDropdown = $(this).closest('.rule-wrapper').find('.rule-dropdown-container select');
                populateDropdownBasedOnOperator(correspondingDropdown, selectedOperator);
              });

              newRule.find('.rule-value-container input').val(rule.value);
              updateDeleteButtonVisibility();
            }
            $('#addRuleBtn').on('click', function () {
              var newRule = $('#ruleTemplate').clone().removeAttr('id');
              newRule.find('select').val('');
              newRule.find('input').val('');

              $('.rules-group-container').append(newRule);

              newRule.find('.rule-filter-container select').each(function () {
                $(this).empty();
                addFilterOptions($(this), filters);
              });

              newRule.find('.rule-operator-container select').each(function () {
                $(this).empty();
                addOperatorOptions($(this));
              }).on('change', function () {
                const selectedOperator = $(this).val();
                const correspondingDropdown = $(this).closest('.rule-wrapper').find('.rule-dropdown-container select');
                populateDropdownBasedOnOperator(correspondingDropdown, selectedOperator);
              });

              newRule.find('.rule-dropdown-container').hide();
              updateDeleteButtonVisibility();
            });

            $('.rules-group-container').on('click', '.remove-rule-btn', function () {
              $(this).closest('.rule-container').remove();
              updateDeleteButtonVisibility();
            });

            $('#ruleTemplate .rule-filter-container select').each(function () {
              $(this).empty();
              addFilterOptions($(this), filters);
            });
            $('#ruleTemplate .rule-operator-container select').each(function () {
              addOperatorOptions($(this));
            }).on('change', function () {
              const selectedOperator = $(this).val();
              const correspondingDropdown = $(this).closest('.rule-wrapper').find('.rule-dropdown-container select');
              populateDropdownBasedOnOperator(correspondingDropdown, selectedOperator);
            });
            updateDeleteButtonVisibility();

            if(selectedcellData?.selectedRuleData) {
              const selectedSourceFromCellNew = Object.values(JSON.parse(selectedcellData.selectedRuleData).selectedSource);
              if(selectedcellData?.selectedRuleData && JSON.parse(selectedcellData.selectedRuleData).filterDataBuilderQuery){
                const existingRules = JSON.parse(selectedcellData.selectedRuleData).filterDataBuilderQuery;
                $('.rules-group-container .rule-container').each(function() {
                  if (!$(this).attr('id')) {
                      $(this).remove();
                  }
                });
                existingRules.rules.forEach(rule => addRuleRow(rule));
                $('#ruleTemplate').remove();
                $('.rules-group-header').siblings('.rule-container').first().attr('id','ruleTemplate');
                updateDeleteButtonVisibility();
              }
            }
          });
        }
        else {
          formattermodal.style.display = "none";
          alert("source data not found");
        }
      }
      else {
        let cellAttributesData = null;
        let allSourceDataJSON = [];
        for(var i=0;i<resultCell.length;i++) {
          cellAttributesData = getJsonDataFromCell(resultCell[i]);
          if(cellAttributesData?.jsonData) {
            allSourceDataJSON.push(cellAttributesData.jsonData);
            selectedWorkspace.push(cellAttributesData.selectedworkSpaceData);
          }
        }
        if(allSourceDataJSON?.length) {
          $('#formatter-select-source-wrapper').css('display', 'flex');
          const select = $('#formatter-select-source');
          select.empty();
  
          const defaultOption = document.createElement("option");
            defaultOption.value = "";
            defaultOption.text = "Select an option";
            defaultOption.disabled = true;
            defaultOption.selected = true;
            select.append(defaultOption);
  
          allSourceDataJSON.forEach(function(item) {
                  const parentKey = Object.keys(item)[0];
                  const value = JSON.stringify(item[parentKey]);
  
                  const option = document.createElement("option");
                  option.value = value;
                  option.text = parentKey;
  
                  select.append(option);
          });
  
          // Example of handling the selection
          $('#formatter-select-source').on('change', function() {
              const selectedValue = $(this).val();
              selectedSource = selectedValue;
              if (selectedValue) {
                const filters = formatterJsonToFilterArray(JSON.parse(selectedValue),true);
                $(document).ready(function () {
                  //TODO: for multiple block
                });
                /* const selectedSourceNew = JSON.parse(selectedSource);
                if(selectedcellData?.selectedRuleData) {
                  const selectedSourceFromCellNew = Object.values(JSON.parse(selectedcellData.selectedRuleData).selectedSource);
                  if(selectedcellData?.selectedRuleData && deepEqual(selectedSourceNew, selectedSourceFromCellNew) && JSON.parse(selectedcellData.selectedRuleData).filterDataBuilderQuery){
                    const existingRules = JSON.parse(selectedcellData.selectedRuleData).filterDataBuilderQuery;
                    $('.rules-group-container .rule-container').each(function() {
                      if (!$(this).attr('id')) {
                          $(this).remove();
                      }
                    });
                    existingRules.rules.forEach(rule => addRuleRow(rule));
                    $('#ruleTemplate').remove();
                    $('.rules-group-header').siblings('.rule-container').first().attr('id','ruleTemplate');
                  }
                } */
              }
          });

          if(selectedcellData?.selectedRuleData && JSON.parse(selectedcellData.selectedRuleData).selectedSource){
            const selectedValue = JSON.parse(selectedcellData.selectedRuleData).selectedSource;
            select.val(JSON.stringify(Object.values(selectedValue))).trigger('change');
          }
        }
        else {
          formattermodal.style.display = "none";
          alert("source data not found");
        }
      }
    }
  }
  else {
    formattermodal.style.display = "none";
  }
}

function collectRuleData() {
  const rules = [];

  $('.rule-container').each(function () {
      const id = $(this).find('.rule-filter-container select').val();
      const field = $(this).find('.rule-filter-container select option:selected').text();
      const operator = $(this).find('.rule-operator-container select').val();
      const value = $(this).find('.rule-value-container input').val();
      const valuePlusDropdown = $(this).find('.rule-dropdown-container select');
      const valuePlus = valuePlusDropdown.val() || valuePlusDropdown.find('option:selected').val();
      const rule = {
          id: id,
          field: field,
          type: 'string',
          input: 'text',
          operator: operator,
          value: value
      };

      if (valuePlus !== undefined) {
          rule.valuePlus = valuePlus;
      }

      rules.push(rule);
  });

  return {
      type: 'Format',
      rules: rules
  };
}

function closeformatterModal() {
  formattermodal.style.display = "none";
  clearListner();
}

function clearListner() {
  $('#addRuleBtn').off('click');
  $('.rules-group-container').off('click', '.remove-rule-btn');
  $('#ruleTemplate .rule-operator-container select').off('change');
  getQueryRulesData = null;
  selectedWorkspace = [];
}

function formattermodalOpen(cellData) {
  selectedcellData = cellData;

  openformatterModal();
}

function getJsonDataFromCellFormatter(cell) {
  if (cell && cell.getValue()) {
    var value = cell.getValue();

    if (mxUtils.isNode(value)) {
      var jsonDataString = value.getAttribute('jsonData');
      var jsonData;
      try {
        jsonData = JSON.parse(jsonDataString);
      } catch (e) {
        jsonData = {'New' : { [jsonDataString] : 'string'}};
      }

      return jsonData;
    } else {
      console.error("The cell value is not an XML node.");
    }
  } else {
    console.error("The cell is empty or does not have a value.");
  }
  return null;
}

function formatterJsonToFilterArray(json, isMultipleSourceData = false) {
  let filters = [];
  const sourcBlockData = isMultipleSourceData ? json : Object.values(json)[0];
  if (sourcBlockData && Array.isArray(sourcBlockData)) {
    filters.push(...sourcBlockData.map(source => ({
      id: source.id,
      label: formatLabel(source.value),
      type: mapType(source[source.value]),
      operators: queryBuilderArray
    })));
  }
  return filters;
}

function countEdges(cell) {
  var model = window.editorUiObj.editor.graph.getModel();
  var incomingEdges = 0;
  var incomingEdgesData = [];
  var outgoingEdges = 0;
  var outgoingEdgesData = [];

  // Get all edges connected to the cell
  var edges = model.getEdges(cell);

  // Loop through each edge to determine if it's incoming or outgoing
  for (var i = 0; i < edges.length; i++) {
      var edge = edges[i];

      // Get the source and target terminals of the edge
      var source = model.getTerminal(edge, true); // true for source
      var target = model.getTerminal(edge, false); // false for target

      // Check if the clicked cell is the source or target
      if (source === cell) {
          outgoingEdges++;
          outgoingEdgesData.push(source);
      } else if (target === cell) {
          incomingEdges++;
          incomingEdgesData.push(target);
      }
  }

  return {
      incoming: incomingEdges,
      outgoing: outgoingEdges,
      incomingEdgesData: incomingEdgesData,
      outgoingEdgesData: outgoingEdgesData,
  };
}

function traverseGraph(cell, sourceDataCells = [], visited = new Set()) {
  var model = window.editorUiObj.editor.graph.getModel();

  if (!visited.has(cell)) {
    visited.add(cell);
    if (cell.style.includes('source_data')) {
      sourceDataCells.push(cell);
    }

    if (cell.edges?.length) {

      for (var i = 0; i < cell.edges.length; i++) {
        var edge = cell.edges[i];
        var connectedCellIncoming = model.getTerminal(edge, true);
        if (connectedCellIncoming && !visited.has(connectedCellIncoming)) {
          traverseGraph(connectedCellIncoming, sourceDataCells, visited);
        }
      }
    }
  }
  return sourceDataCells;
}

function allFilterConnectedCells(cell, filterDataCells = [], visited = new Set()) {
  var model = window.editorUiObj.editor.graph.getModel();

  if (!visited.has(cell)) {
    visited.add(cell);
    if (cell.style.includes('data_filter') || cell.style.includes('data_formatter')) {
      // debugger;
      filterDataCells.push(cell);
    }

    if (cell.edges?.length) {

      for (var i = 0; i < cell.edges.length; i++) {
        var edge = cell.edges[i];
        var connectedCellIncoming = model.getTerminal(edge, true);
        if (connectedCellIncoming && !visited.has(connectedCellIncoming)) {
          allFilterConnectedCells(connectedCellIncoming, filterDataCells, visited);
        }
      }
    }
  }
  return filterDataCells;
}

function setAddDeleteRuleOrGroupFormatter() {
  const addRuleBtn = document.querySelectorAll('.btn-xs.btn-success[data-add="rule"]');
  const addGroupBtn = document.querySelectorAll('.btn-xs.btn-success[data-add="group"]');
  const deleteBtn = document.querySelectorAll('.btn-xs.btn-danger[data-delete="rule"]');
  if (addRuleBtn) {
    addRuleBtn.forEach((ele) => {
      ele.innerHTML = `<i class="glyphicon glyphicon-plus"></i> Rule`;
    });
  }
  if (addGroupBtn) {
    addGroupBtn.forEach((ele) => {
      ele.innerHTML = `<i class="glyphicon glyphicon-plus-sign"></i> Group`;
      ele.style.display = 'none';
    });
  }
  if(deleteBtn) {
    deleteBtn.forEach((ele) => {
      ele.innerHTML = `<i class="fa fa-trash">`;
    });
  }
}


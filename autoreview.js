/** @preserve
// ==UserScript==
// @name          Auto-Review
// @grant         none
// @author        Simon Forsberg
// @namespace     zomis
// @homepage      https://www.github.com/Zomis/Auto-Review
// @description	  Adds checkboxes for copying code in a post to an answer.
// @include       http://stackoverflow.com/*
// @include       http://meta.stackoverflow.com/*
// @include       http://superuser.com/*
// @include       http://serverfault.com/*
// @include       http://meta.superuser.com/*
// @include       http://meta.serverfault.com/*
// @include       http://stackapps.com/*
// @include       http://askubuntu.com/*
// @include       http://*.stackexchange.com/*
// @exclude       http://chat.stackexchange.com/*
// ==/UserScript==
*/

function embedFunction(name, theFunction) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.textContent = theFunction.toString().replace(/function ?/, 'function ' + name);
    document.getElementsByTagName('head')[0].appendChild(script);
}

embedFunction('showAutoreviewButtons', function(clickedObject) {
	
	var i;
	var checkbox;
	if (clickedObject.data('review')) {
		var answer = $("#wmd-input");
		var answer_text = answer.val();
		var added_lines = 0;
		var added_blocks = 0;
		
		// loop through checkboxes and prepare answer
		var checkboxes = $("input.autoreview");
		var block = [];
		for (i = 0; i < checkboxes.length; i++) {
			checkbox = $(checkboxes[i]);
			if (!checkbox.prop('checked')) {
				continue;
			}
			
			var line_data = checkbox.data('line');
			block.push(line_data);
			if ((i === checkboxes.length - 1) || !$(checkboxes[i + 1]).prop('checked')) {
				// add block
				var block_line;
				var cut_count = 1000;
				for (block_line = 0; block_line < block.length; block_line++) {
					var cut_this = block[block_line].indexOf(block[block_line].trim());
					if (cut_count > cut_this) {
						cut_count = cut_this;
					}
				}
				for (block_line = 0; block_line < block.length; block_line++) {
					answer_text	+= "\n    " + block[block_line].substr(cut_count);
				}
				answer_text	+= "\n\n---\n";
				added_lines += block.length;
				added_blocks++;
				block = [];
			}
			checkbox.prop('checked', false);
		}
		
		answer.val(answer_text);
        $('html, body').animate({
            scrollTop: answer.offset().top
        }, 1000);
		return;
	}
	clickedObject.data('review', true);
	clickedObject.text("Add to answer");
	
	var spans = $("code span", clickedObject.next());
	
	var count = spans.length;
	var line = "";
	var first = null;
	
	var checkboxClick = function(e) {
		if (e.shiftKey) {
			var all_checkboxes = $('code checkbox.autoreview');
			var current_checkbox = $(this);
			var selected = !current_checkbox.prop('checked');
			do {
				current_checkbox.prop('checked', !selected);
				current_checkbox = current_checkbox.prevAll('.autoreview:first');
			}
			while (current_checkbox.length === 1 && current_checkbox.prop('checked') == selected);
		}
	}
	
	for (i = 0; i < count; i++) {
		var element = $(spans[i]);
		
		if (first === null) {
			first = element;
		}
		if (element.text().indexOf("\n") !== -1) {
			var lines = element.text().split("\n");
			element.text("");
			for (var line_index = 1; line_index < lines.length; line_index++) {
				var current_line = lines[line_index];
				var prev_line = lines[line_index - 1];
				
				var span;
				// Add the last part of the previous line
				if (line_index == 1) {
					line += prev_line;
					span = $('<span class="pln">' + prev_line + '\n</span>');
					element.after(span);
					element = span;
				}
				
				// Add the checkbox for the previous line
				if (line.length > 0) {
					checkbox = $('<input type="checkbox" class="autoreview"></input>');
					first.before(checkbox);
					checkbox.data('line', line);
					checkbox.click(checkboxClick);
					first = null;
				}
				
				// Add the beginning <span> element for the current line
				if (line_index < lines.length - 1) {
					current_line += "\n";
				}
				span = $('<span class="pln">' + current_line + '</span>');
				element.after(span);
				first = span;
				element = span;
				line = current_line;
			}
		}
		else {
			line += element.text();
		}
	}
	if (line.length > 0) {
		checkbox = $('<input type="checkbox" class="autoreview"></input>');
		first.before(checkbox);
		checkbox.data('line', line);
		checkbox.click(checkboxClick);
	}
});

$('pre code').parent().before('<a href="javascript:void(0);" onclick="showAutoreviewButtons($(this))">(Review)</a>');

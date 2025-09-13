package searchMethod;

import java.util.ArrayList;

import filters.Filter;

public class offsetTemplate_dataStructure 
{
	public double offset_property = 0;
	
	public ArrayList<Double> offset_template_option = new ArrayList<Double>();
	
	public offsetTemplate_dataStructure (double offset_p, ArrayList<Double> offset_value)
	{
		this.offset_property = offset_p;
		
		for (Double d : offset_value)
		{
			offset_template_option.add(d);
		}
	}
}
